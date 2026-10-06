# ⚔️ House Jaydev — Game of Thrones 3D Portfolio

An epic, high-performance portfolio website built around the **Game of Thrones** universe for **Jaydev**, a 1st-year B.Tech Computer Science student at **Jaipur Engineering College and Research Centre (JECRC)**.

Featuring an interactive **3D Valyrian Steel Bastard Sword** rendered with Three.js (WebGL) that moves and shifts stances dynamically as you scroll through the website.

---

## 🌟 Key Features

1. **Interactive 3D Valyrian Steel Sword (Three.js & WebGL)**:
   - Procedural Damascus ripple steel blade with fuller (blood groove) and glowing ancient runes.
   - Ornate swept crossguard with Direwolf quillons and leather/gold-wire bound hilt.
   - Luminous gemstone pommel with dynamic PointLight casting real-time specular highlights.
   - **Scroll Stances**:
     - *Hero Section*: Majestic vertical floating stance with breathing and mouse parallax.
     - *About Section*: Slanted slash stance examining the blade's edge.
     - *Skills Section*: Defensive horizontal parry stance with glowing runes.
     - *Projects Section*: Forward perspective thrust stance.
     - *Contact Section*: Plunged vertically into an ancient carved runic stone pedestal.
   - **3D Free Orbit Inspect Mode**: Click "Inspect 3D Blade" to freely grab, rotate 360°, and zoom the sword!

2. **Realms Switcher**:
   - **Winterfell (House Stark)**: Pale icy blues, falling snowflakes, frosty reflections.
   - **Valyria (House Targaryen)**: Volcanic embers, obsidian blacks, crimson and gold flames.

3. **Custom Profile Photo Uploader**:
   - Comes pre-equipped with an AI-generated Game of Thrones knight/scholar portrait for Jaydev.
   - Includes a built-in **"Enshrine Your Photo"** button right on the page allowing Jaydev to upload his real photo anytime with instant preview and local browser persistence!

4. **Web Audio Soundscapes**:
   - Synthesizes realistic blade unsheathing, metallic clashes, and ambient winds using the Web Audio API without external file dependencies.
   - Toggle button on the navigation bar (muted by default for seamless browsing).

5. **Westerosi Parchment Contact Form**:
   - Custom parchment scroll with interactive crimson wax seal stamping button that dispatches raven messages.

---

## 🚀 How to Run Locally

Because the portfolio is built with modern, zero-dependency web standards (HTML5, CSS3, ES modules, Three.js), you can run it immediately with Python:

```bash
# In the project directory:
python -m http.server 8000
```
Then open your browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

*(Alternatively, you can double-click `index.html` in your file explorer to open it directly in any modern browser!)*

---

## 🛠️ Project Structure

```
Antigravity/
├── index.html              # Main HTML structure with GoT sections
├── css/
│   ├── style.css           # Core styling, responsive grid, animations
│   └── got-theme.css       # Realm variables, gold filigree, wax seals
├── js/
│   ├── main.js             # Scroll triggers, realm switch, photo upload logic
│   ├── sword3d.js          # Three.js 3D Valyrian sword, stances, 360 inspect
│   ├── particles.js        # Canvas particle system (snowflakes vs embers)
│   └── soundfx.js          # Procedural Web Audio synthesizer
├── assets/
│   └── images/
│       ├── jaydev_got_avatar.jpg   # GoT scholar-warrior portrait
│       └── house_sigil.svg         # House Jaydev heraldic shield
└── README.md
```

---

## 🌐 Free Deployment (GitHub Pages)

To host your portfolio live on the web for free:
1. Push this folder to a GitHub repository (e.g. `jaydev-portfolio`).
2. Go to **Repository Settings** -> **Pages**.
3. Under **Branch**, select `main` and root `/` folder, then click **Save**.
4. Your website will be live at `https://<your-username>.github.io/jaydev-portfolio/`!
