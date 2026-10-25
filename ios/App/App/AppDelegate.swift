import UIKit
import Capacitor
import CoreLocation
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

// Stamp the Past: keeps a copy of the player's progress in the app's own storage
// (UserDefaults, part of the normal iPhone backup) so a web-view cache wipe cannot erase stamps.
@objc(StampStorePlugin)
public class StampStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StampStorePlugin"
    public let jsName = "StampStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getAll", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeItem", returnType: CAPPluginReturnPromise)
    ]
    private let prefix = "stp."

    @objc func getAll(_ call: CAPPluginCall) {
        var out: [String: String] = [:]
        for (k, v) in UserDefaults.standard.dictionaryRepresentation() {
            if k.hasPrefix(prefix), let s = v as? String {
                out[String(k.dropFirst(prefix.count))] = s
            }
        }
        call.resolve(["values": out])
    }

    @objc func setItem(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let value = call.getString("value") else {
            call.reject("key and value are required")
            return
        }
        UserDefaults.standard.set(value, forKey: prefix + key)
        call.resolve()
    }

    @objc func removeItem(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("key is required")
            return
        }
        UserDefaults.standard.removeObject(forKey: prefix + key)
        call.resolve()
    }
}


// Stamp the Past: optional "you are near a stop" alerts, even when the app is closed.
// Uses iOS region monitoring (no tracking, nothing is sent anywhere). iOS allows 20 regions at a time,
// so the 20 nearest not-yet-stamped stops are watched and the list is refreshed on big moves.
@objc(StampGeoPlugin)
public class StampGeoPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate, UNUserNotificationCenterDelegate {
    public let identifier = "StampGeoPlugin"
    public let jsName = "StampGeo"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "enable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pending", returnType: CAPPluginReturnPromise)
    ]
    private let mgr = CLLocationManager()
    private let kStops = "stampgeo.stops"
    private let kOn = "stampgeo.on"
    private let kPending = "stampgeo.pending"
    private let kSeen = "stampgeo.seen"

    override public func load() {
        mgr.delegate = self
        UNUserNotificationCenter.current().delegate = self
        if UserDefaults.standard.bool(forKey: kOn) { startMonitoring() }
    }

    @objc func enable(_ call: CAPPluginCall) {
        guard let arr = call.getArray("stops") else { call.reject("stops required"); return }
        if let data = try? JSONSerialization.data(withJSONObject: arr), let str = String(data: data, encoding: .utf8) {
            UserDefaults.standard.set(str, forKey: kStops)
        }
        UserDefaults.standard.set(true, forKey: kOn)
        DispatchQueue.main.async {
            self.mgr.requestAlwaysAuthorization()
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
            self.startMonitoring()
            call.resolve(["status": self.statusText()])
        }
    }

    @objc func disable(_ call: CAPPluginCall) {
        UserDefaults.standard.set(false, forKey: kOn)
        DispatchQueue.main.async {
            for r in self.mgr.monitoredRegions { self.mgr.stopMonitoring(for: r) }
            self.mgr.stopMonitoringSignificantLocationChanges()
            call.resolve()
        }
    }

    @objc func pending(_ call: CAPPluginCall) {
        let v = UserDefaults.standard.string(forKey: kPending) ?? ""
        UserDefaults.standard.removeObject(forKey: kPending)
        call.resolve(["id": v])
    }

    private func statusText() -> String {
        switch mgr.authorizationStatus {
        case .authorizedAlways: return "always"
        case .authorizedWhenInUse: return "whenInUse"
        case .denied, .restricted: return "denied"
        default: return "unknown"
        }
    }

    private func startMonitoring() {
        mgr.startMonitoringSignificantLocationChanges()
        refreshRegions(near: mgr.location)
        mgr.requestLocation()
    }

    private func loadStops() -> [[String: Any]] {
        guard let str = UserDefaults.standard.string(forKey: kStops),
              let data = str.data(using: .utf8),
              let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return [] }
        return arr
    }

    private func refreshRegions(near loc: CLLocation?) {
        guard UserDefaults.standard.bool(forKey: kOn), CLLocationManager.isMonitoringAvailable(for: CLCircularRegion.self) else { return }
        var stops = loadStops()
        if let l = loc {
            stops.sort { a, b in
                let da = l.distance(from: CLLocation(latitude: (a["lat"] as? Double) ?? 0, longitude: (a["lon"] as? Double) ?? 0))
                let db = l.distance(from: CLLocation(latitude: (b["lat"] as? Double) ?? 0, longitude: (b["lon"] as? Double) ?? 0))
                return da < db
            }
        }
        for r in mgr.monitoredRegions { mgr.stopMonitoring(for: r) }
        for st in stops.prefix(20) {
            guard let id = st["id"] as? String, let lat = st["lat"] as? Double, let lon = st["lon"] as? Double else { continue }
            let rad = min(max((st["r"] as? Double) ?? 200, 100), mgr.maximumRegionMonitoringDistance)
            let region = CLCircularRegion(center: CLLocationCoordinate2D(latitude: lat, longitude: lon), radius: rad, identifier: id)
            region.notifyOnEntry = true
            region.notifyOnExit = false
            mgr.startMonitoring(for: region)
        }
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        refreshRegions(near: locations.last)
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if UserDefaults.standard.bool(forKey: kOn) { startMonitoring() }
    }

    public func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        let id = region.identifier
        var seen = (UserDefaults.standard.dictionary(forKey: kSeen) as? [String: Double]) ?? [:]
        let now = Date().timeIntervalSince1970
        if let t = seen[id], now - t < 6 * 3600 { return }
        seen[id] = now
        UserDefaults.standard.set(seen, forKey: kSeen)
        var name = "a stop"
        if let st = loadStops().first(where: { ($0["id"] as? String) == id }), let n = st["n"] as? String { name = n }
        let content = UNMutableNotificationContent()
        content.title = "You are near " + name
        content.body = "Open Stamp the Past to find it and earn the stamp."
        content.sound = .default
        content.userInfo = ["id": id]
        let req = UNNotificationRequest(identifier: "near-" + id, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(req, withCompletionHandler: nil)
    }

    // Do not show a banner while the app is open (the app has its own prompt).
    public func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([])
    }

    public func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        if let id = response.notification.request.content.userInfo["id"] as? String {
            UserDefaults.standard.set(id, forKey: kPending)
            notifyListeners("stopTap", data: ["id": id])
        }
        completionHandler()
    }
}

@objc(StampViewController)
class StampViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(StampStorePlugin())
        bridge?.registerPluginInstance(StampGeoPlugin())
    }
}
