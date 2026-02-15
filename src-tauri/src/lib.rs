use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Listener,
    Manager,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // Handle deep link URLs (e.g. disasterconnect://auth/callback#access_token=...)
            #[cfg(desktop)]
            {
                let handle = app.handle().clone();
                app.listen("deep-link://new-url", move |event| {
                    if let Ok(urls) = serde_json::from_str::<Vec<String>>(event.payload()) {
                        if let Some(url) = urls.first() {
                            if let Some(window) = handle.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let js = format!(
                                    "window.__DEEP_LINK_URL__ = '{}'; window.dispatchEvent(new CustomEvent('deep-link', {{ detail: '{}' }}));",
                                    url.replace('\'', "\\'"),
                                    url.replace('\'', "\\'")
                                );
                                let _ = window.eval(&js);
                            }
                        }
                    }
                });
            }
            // Build tray menu
            let show = MenuItemBuilder::with_id("show", "Show DisasterConnect")
                .build(app)?;
            let dashboard = MenuItemBuilder::with_id("dashboard", "Open Dashboard")
                .build(app)?;
            let incidents = MenuItemBuilder::with_id("incidents", "View Incidents")
                .build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit")
                .build(app)?;

            let menu = MenuBuilder::new(app)
                .item(&show)
                .separator()
                .item(&dashboard)
                .item(&incidents)
                .separator()
                .item(&quit)
                .build()?;

            let _tray = TrayIconBuilder::new()
                .tooltip("DisasterConnect")
                .menu(&menu)
                .on_menu_event(move |app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "dashboard" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.eval("window.location.hash = '#/dashboard';");
                            }
                        }
                        "incidents" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.eval("window.location.hash = '#/incidents';");
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
