# 📱 Bluesky Thread Poster

Eine moderne Web-Anwendung zum Erstellen und Posten von längeren Threads auf Bluesky.

## ✨ Features

- **Einfache Authentifizierung** mit Bluesky Handle und App Password
- **Dynamische Thread-Erstellung** mit mehreren Posts
- **Zeichenzähler** für jeden Post (300 Zeichen Limit)
- **Responsive Design** für Desktop und Mobile
- **Moderne UI** mit schönen Animationen
- **Frontend-only** - keine Server-Installation nötig

## 🚀 Installation und Start

1. **Repository klonen oder Dateien herunterladen**

2. **Dependencies installieren:**
   ```bash
   npm install
   ```

3. **Entwicklungsserver starten:**
   ```bash
   npm start
   ```
   
   Die App öffnet sich automatisch im Browser unter `http://localhost:3000`

## 🔧 Verwendung

### 1. Anmeldung
- Gib dein Bluesky Handle ein (z.B. `deinname.bsky.social`)
- Erstelle ein **App Password** in deinen Bluesky Einstellungen:
  - Gehe zu Bluesky → Einstellungen → App Passwords
  - Erstelle ein neues App Password
  - Verwende dieses Password (nicht dein normales Passwort!)

### 2. Thread erstellen
- Schreibe deinen ersten Post in das Hauptfeld
- Klicke auf "➕ Weiteren Post hinzufügen" für zusätzliche Posts
- Jeder Post kann bis zu 300 Zeichen haben
- Du kannst bis zu 10 Posts pro Thread erstellen

### 3. Thread posten
- Klicke auf "🚀 Thread posten"
- Die App postet alle Posts nacheinander als zusammenhängenden Thread
- Du erhältst eine Bestätigung wenn der Thread erfolgreich gepostet wurde

## 🛠️ Technische Details

### Bluesky API Integration
- Verwendet die offizielle Bluesky AT Protocol API
- Authentifizierung über `com.atproto.server.createSession`
- Posts werden über `com.atproto.repo.createRecord` erstellt
- Automatische Thread-Verkettung durch Reply-Referenzen

### Technologie-Stack
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **API:** Bluesky AT Protocol REST API
- **Dev Server:** http-server für lokale Entwicklung

### Sicherheit
- App Passwords werden nur temporär im Speicher gehalten
- Keine Speicherung von Anmeldedaten
- HTTPS-Kommunikation mit Bluesky API

## 📝 Keyboard Shortcuts

- **Ctrl + Enter:** Thread posten (wenn in einem Textfeld)

## 🎨 Features im Detail

### Responsive Design
- Optimiert für Desktop und Mobile Geräte
- Touch-freundliche Bedienelemente
- Adaptive Layouts

### Benutzerfreundlichkeit
- Echtzeit-Zeichenzähler mit Farbkodierung
- Automatische Fokussierung neuer Textfelder
- Intuitive Bedienung mit klaren Buttons
- Statusmeldungen für alle Aktionen

### Fehlerbehandlung
- Validierung aller Eingaben
- Aussagekräftige Fehlermeldungen
- Retry-Mechanismen für API-Aufrufe

## 🔍 Troubleshooting

### Anmeldung funktioniert nicht
- Überprüfe dein Handle (muss vollständig sein, z.B. `name.bsky.social`)
- Stelle sicher, dass du ein **App Password** verwendest, nicht dein normales Passwort
- App Passwords erstellst du in den Bluesky Einstellungen

### Posts werden nicht gepostet
- Überprüfe deine Internetverbindung
- Stelle sicher, dass Posts nicht zu lang sind (max. 300 Zeichen)
- Bei wiederholten Fehlern: Neu anmelden

### Browser-Kompatibilität
- Moderne Browser (Chrome, Firefox, Safari, Edge)
- JavaScript muss aktiviert sein
- Cookies müssen erlaubt sein

## 📄 Lizenz

MIT License - Du kannst die App frei verwenden und anpassen.

## 🤝 Beitragen

Verbesserungsvorschläge und Bug-Reports sind willkommen!

---

**Viel Spaß beim Threaden auf Bluesky! 🐦💙**
