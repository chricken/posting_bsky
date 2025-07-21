/**
 * GuideModal Komponente zur Anzeige der Anleitung
 */
class GuideModal {
    /**
     * Erstellt eine neue GuideModal-Instanz
     */
    constructor() {
        // HTML für die Anleitung - ohne Abhängigkeit von Whitespace im Template
        this.guideContent = this.createGuideContent();
    }

    /**
     * Erstellt den HTML-Inhalt für die Anleitung
     * Hier werden Leerzeichen und Zeilenumbrüche im Code nicht ins Layout übernommen
     */
    createGuideContent() {
        // Erstelle alle HTML-Elemente und füge sie zusammen
        const content = [
            '<div class="guide-content">',
            '<h2>🔧 Verwendung</h2>',
            '<h3>1. Anmeldung</h3>',
            '<ul>',
            '<li>Gib dein Bluesky Handle ein (z.B. <code>deinname.bsky.social</code>)</li>',
            '<li>Erstelle ein <strong>App Password</strong> in deinen Bluesky Einstellungen:',
            '<ul>',
            '<li>Gehe zu Bluesky → Einstellungen → App Passwords</li>',
            '<li>Erstelle ein neues App Password</li>',
            '<li>Verwende dieses Password (nicht dein normales Passwort!)</li>',
            '</ul>',
            '</li>',
            '</ul>',
            '<h3>2. Thread erstellen</h3>',
            '<ul>',
            '<li>Schreibe deinen ersten Post in das Hauptfeld</li>',
            '<li>Weitere Posts werden automatisch hinzugefügt oder mit dem + Button neben jedem Post</li>',
            '<li>Wähle für jeden Post die gewünschte Formatierung (Normal, Code, Kursiv)</li>',
            '<li>Jeder Post kann bis zu 300 Zeichen haben</li>',
            '<li>Du kannst bis zu 200 Posts pro Thread erstellen</li>',
            '<li>Die automatische Textbereinigung entfernt Zeilenumbrüche vor Punktuation für optimale Lesbarkeit</li>',
            '</ul>',
            '<h3>3. Thread posten</h3>',
            '<ul>',
            '<li>Klicke auf "🚀 Thread posten"</li>',
            '<li>Die App postet alle Posts nacheinander als zusammenhängenden Thread</li>',
            '<li>Du erhältst eine Bestätigung wenn der Thread erfolgreich gepostet wurde</li>',
            '</ul>',
            '<h3>4. JSON-Funktionen</h3>',
            '<ul>',
            '<li><strong>JSON anzeigen:</strong> Zeigt deine aktuellen Posts als JSON-Code an</li>',
            '<li><strong>JSON-Datei laden:</strong> Importiert Posts aus einer JSON-Datei</li>',
            '<li><strong>JSON-Code einfügen:</strong> Fügt JSON-Code direkt ein (unterstützt Arrays aus Strings oder Objekten)</li>',
            '</ul>',
            '</div>'
        ];

        // Gib den HTML-String zurück, ohne Abhängigkeit von Whitespace im Code
        return content.join('');
    }

    /**
     * Zeigt die Anleitung in einem Modal-Fenster an
     */
    showGuide() {
        // Verwendet die allgemeine Modal-Komponente zum Anzeigen
        Modal.showHTML(
            "Anleitung zur Verwendung",
            this.guideContent
        );
    }

    /**
     * Statische Methode zum direkten Anzeigen der Anleitung
     */
    static show() {
        const guideModal = new GuideModal();
        guideModal.showGuide();
    }
}

// Die Komponente global verfügbar machen
window.GuideModal = GuideModal;
