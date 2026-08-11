// 60 products for BIGTECH — 10 per category, realistic August 2026 USD pricing.
// USD -> NIO conversion rate used throughout: 1 USD = 36.7 NIO
const RATE = 36.7;

const products = [
  // ---------------- PLAYSTATION (10) ----------------
  {
    category: "PlayStation",
    name: "PlayStation 5 Slim (Disc Edition)",
    description: "Sony's current-generation console with a built-in Ultra HD Blu-ray disc drive and 1TB SSD. Delivers ray tracing, 4K gaming up to 120fps, and near-instant load times. Includes one DualSense wireless controller.",
    priceUSD: 649.99,
    imageDescription: "Front three-quarter studio shot of the white PS5 slim console standing vertically, disc drive visible on the left edge, on a plain white background with soft even lighting."
  },
  {
    category: "PlayStation",
    name: "PlayStation 5 Digital Edition Slim",
    description: "The all-digital version of the PS5 slim, same power and performance without a disc drive. Perfect for buyers who purchase and stream games digitally. Includes one DualSense wireless controller.",
    priceUSD: 599.99,
    imageDescription: "Front three-quarter studio shot of the white PS5 Digital Edition console standing vertically, smooth uninterrupted front panel (no disc slot), plain white background."
  },
  {
    category: "PlayStation",
    name: "PlayStation 5 Pro",
    description: "The premium PS5 model with enhanced GPU, PSSR AI upscaling, and 2TB of storage for the best possible ray-traced visuals and frame rates. Built for enthusiasts who want the sharpest 4K experience available on console.",
    priceUSD: 899.99,
    imageDescription: "Front three-quarter studio shot of the taller black-and-white PS5 Pro console with its distinct triple-lens front vent design, standing vertically on a plain white background."
  },
  {
    category: "PlayStation",
    name: "DualSense Wireless Controller (Midnight Black)",
    description: "Official PS5 controller featuring adaptive triggers, haptic feedback, and a built-in microphone. Matte black finish with the signature two-tone design. Pairs instantly with any PS5 console.",
    priceUSD: 74.99,
    imageDescription: "Top-down studio photo of a matte black DualSense controller centered on a white background, symmetrical lighting showing the textured grips and lightbar strip."
  },
  {
    category: "PlayStation",
    name: "DualSense Wireless Controller (White)",
    description: "The original white DualSense wireless controller with adaptive triggers and immersive haptic feedback. Comfortable ergonomic grips and a built-in speaker for in-game audio cues.",
    priceUSD: 69.99,
    imageDescription: "Top-down studio photo of the classic white and black two-tone DualSense controller on a plain white background, clean even lighting."
  },
  {
    category: "PlayStation",
    name: "PlayStation VR2",
    description: "Next-generation VR headset for PS5 with 4K HDR OLED displays, eye tracking, and 3D audio. Includes Sense controllers for fully immersive motion-tracked gameplay. Requires a PS5 console.",
    priceUSD: 549.99,
    imageDescription: "Studio product shot of the white PS VR2 headset facing forward on a stand, with the two black Sense controllers placed beside it, plain light background."
  },
  {
    category: "PlayStation",
    name: "PS5 Pulse 3D Wireless Headset",
    description: "Official wireless gaming headset tuned for PS5's 3D audio technology. Dual hidden microphones, up to 12 hours of battery life, and a lightweight matte finish that matches the console design.",
    priceUSD: 99.99,
    imageDescription: "Three-quarter angle studio shot of the white and black Pulse 3D headset on a headphone stand, plain white background, soft studio lighting highlighting the ear cup texture."
  },
  {
    category: "PlayStation",
    name: "PlayStation Portal Remote Player",
    description: "Handheld device that streams your PS5 games directly over Wi-Fi to an 8-inch HD display. Full DualSense-style controls built in, including adaptive triggers and haptic feedback.",
    priceUSD: 249.99,
    imageDescription: "Front-facing studio photo of the PlayStation Portal handheld with its screen showing a generic PlayStation home menu, controller grips visible on both sides, plain white background."
  },
  {
    category: "PlayStation",
    name: "PS5 DualSense Charging Station",
    description: "Official dual charging dock for DualSense wireless controllers. Charges two controllers simultaneously via USB-C without tying up console ports. Compact matching white design.",
    priceUSD: 29.99,
    imageDescription: "Studio product shot of the small white charging dock with two DualSense controllers docked upright side by side, plain white background."
  },
  {
    category: "PlayStation",
    name: "EA Sports FC 26 (PS5)",
    description: "The latest installment in EA's flagship football simulation series, featuring updated squads, HyperMotion animation capture, and online Ultimate Team modes. Physical PS5 disc edition.",
    priceUSD: 69.99,
    imageDescription: "Front-facing studio shot of the PS5 game case standing upright, cover art showing a footballer in action, plain white background."
  },

  // ---------------- LAPTOPS (10) ----------------
  {
    category: "Laptops",
    name: "Apple MacBook Air 13\" M3",
    description: "Ultra-thin fanless laptop powered by Apple's M3 chip, with an 18-hour battery life and a stunning Liquid Retina display. Ideal for students and professionals who need portability without sacrificing performance.",
    priceUSD: 1099,
    imageDescription: "Open MacBook Air on a plain white desk, angled three-quarter view showing the thin wedge profile and keyboard, screen displaying a generic macOS desktop wallpaper."
  },
  {
    category: "Laptops",
    name: "Apple MacBook Pro 14\" M4",
    description: "Professional-grade laptop with the M4 chip, Liquid Retina XDR display, and up to 22 hours of battery life. Built for video editing, software development, and other demanding creative workflows.",
    priceUSD: 1599,
    imageDescription: "Open MacBook Pro 14-inch on a plain white desk, three-quarter angle showing the notch display and space gray aluminum chassis, screen on."
  },
  {
    category: "Laptops",
    name: "Dell XPS 13 (2025)",
    description: "Compact premium ultrabook with a virtually borderless InfinityEdge display and machined aluminum chassis. Intel Core Ultra processor delivers strong everyday performance in a lightweight body.",
    priceUSD: 999,
    imageDescription: "Silver Dell XPS 13 open at a 45-degree angle on a white desk, thin bezel display visible, minimalist keyboard deck."
  },
  {
    category: "Laptops",
    name: "HP Pavilion 15",
    description: "Reliable everyday laptop with a full HD display, roomy keyboard, and long battery life. A great value pick for browsing, office work, and streaming, backed by BIGTECH warranty support.",
    priceUSD: 649,
    imageDescription: "Silver HP Pavilion 15 laptop open on a plain white desk, front-facing angle showing the full-size keyboard and wide display."
  },
  {
    category: "Laptops",
    name: "Lenovo ThinkPad X1 Carbon Gen 12",
    description: "Business-class ultrabook with a carbon-fiber weave chassis, legendary ThinkPad keyboard, and MIL-SPEC durability testing. Combines lightweight portability with enterprise security features.",
    priceUSD: 1699,
    imageDescription: "Black Lenovo ThinkPad X1 Carbon open at an angle on a white desk, red TrackPoint nub visible on the keyboard, matte black lid with ThinkPad logo."
  },
  {
    category: "Laptops",
    name: "Lenovo IdeaPad Slim 5",
    description: "Slim, lightweight laptop with a crisp display and all-day battery life, built for students and home use. Balances solid performance with an accessible price point.",
    priceUSD: 699,
    imageDescription: "Gray Lenovo IdeaPad Slim 5 open on a plain white desk, three-quarter view showing the slim profile and backlit keyboard."
  },
  {
    category: "Laptops",
    name: "ASUS ROG Strix G16",
    description: "High-performance gaming laptop with a 165Hz display, dedicated RTX graphics, and RGB backlit keyboard. Built for demanding modern games and heavy multitasking.",
    priceUSD: 1499,
    imageDescription: "Black ASUS ROG Strix laptop open on a dark surface, RGB keyboard glowing, angled shot highlighting the aggressive vent design on the rear."
  },
  {
    category: "Laptops",
    name: "Acer Aspire 5",
    description: "Budget-friendly laptop offering dependable everyday performance for web browsing, schoolwork, and office tasks. Slim aluminum-style design with a comfortable keyboard.",
    priceUSD: 549,
    imageDescription: "Silver Acer Aspire 5 open on a plain white desk, front-facing angle, screen showing a generic desktop wallpaper."
  },
  {
    category: "Laptops",
    name: "Microsoft Surface Laptop 6",
    description: "Sleek, color-matched laptop with a vibrant PixelSense touchscreen and premium Alcantara or metal keyboard deck. Runs Windows 11 with fast wake and all-day battery life.",
    priceUSD: 999,
    imageDescription: "Platinum-colored Surface Laptop open on a white desk, touchscreen visible, rounded corners and slim bezels highlighted from a three-quarter angle."
  },
  {
    category: "Laptops",
    name: "HP Spectre x360 14",
    description: "Premium 2-in-1 convertible laptop with a gem-cut design, OLED touchscreen, and 360-degree hinge for laptop, tablet, or tent modes. Includes an active stylus pen.",
    priceUSD: 1399,
    imageDescription: "Dark blue and copper-trimmed HP Spectre x360 shown half-folded in tent mode on a white desk, OLED screen glowing, stylus resting beside it."
  },

  // ---------------- PHONES (10) ----------------
  {
    category: "Phones",
    name: "Apple iPhone 16 Pro Max",
    description: "Apple's largest flagship phone with a titanium frame, A18 Pro chip, and a 48MP triple-camera system with 5x telephoto zoom. Features a 6.9-inch ProMotion display and all-day battery life.",
    priceUSD: 1199,
    imageDescription: "Front and back studio shot of the iPhone 16 Pro Max in Desert Titanium, angled to show the camera module, on a plain white background."
  },
  {
    category: "Phones",
    name: "Apple iPhone 16 Pro",
    description: "Compact flagship with the same A18 Pro chip and triple-camera system as the Pro Max in a more pocketable 6.3-inch body. Titanium design with a customizable Action button.",
    priceUSD: 999,
    imageDescription: "Front and back studio shot of the iPhone 16 Pro in Natural Titanium, camera module visible, plain white background, soft even lighting."
  },
  {
    category: "Phones",
    name: "Apple iPhone 16",
    description: "The standard iPhone 16 with A18 chip, a dual-camera system, and Apple's Ceramic Shield front cover. Available in a range of vibrant aluminum finishes.",
    priceUSD: 799,
    imageDescription: "Front and back studio shot of the iPhone 16 in blue aluminum finish, dual rear cameras visible, plain white background."
  },
  {
    category: "Phones",
    name: "Samsung Galaxy S24 Ultra",
    description: "Samsung's top-tier Android flagship with a 200MP main camera, built-in S Pen, and a titanium frame. 6.8-inch Dynamic AMOLED 2X display with a 120Hz adaptive refresh rate.",
    priceUSD: 1199,
    imageDescription: "Front and back studio shot of the Galaxy S24 Ultra in Titanium Black, S Pen resting beside it, plain white background."
  },
  {
    category: "Phones",
    name: "Samsung Galaxy S24",
    description: "Compact flagship with a bright 6.2-inch display, triple rear camera system, and Galaxy AI features for photo editing and translation. Durable Gorilla Glass Victus 2 front and back.",
    priceUSD: 799,
    imageDescription: "Front and back studio shot of the Galaxy S24 in Onyx Black, triple camera module visible, plain white background."
  },
  {
    category: "Phones",
    name: "Samsung Galaxy A55",
    description: "Mid-range Galaxy phone with a large Super AMOLED display, solid all-day battery, and IP67 water resistance. Great value for everyday use, from social media to streaming.",
    priceUSD: 449,
    imageDescription: "Front and back studio shot of the Galaxy A55 in Awesome Navy, plain white background, angled to show the camera bump."
  },
  {
    category: "Phones",
    name: "Google Pixel 9 Pro",
    description: "Google's flagship Pixel with the Tensor G4 chip, a triple 50MP camera system, and industry-leading computational photography features powered by on-device AI.",
    priceUSD: 999,
    imageDescription: "Front and back studio shot of the Pixel 9 Pro in Obsidian, distinctive camera bar visible across the back, plain white background."
  },
  {
    category: "Phones",
    name: "Google Pixel 8a",
    description: "Affordable Pixel with the same Tensor G3 chip found in the flagship series, a 64MP main camera, and clean stock Android with guaranteed multi-year update support.",
    priceUSD: 499,
    imageDescription: "Front and back studio shot of the Pixel 8a in Bay blue, camera bar visible, plain white background."
  },
  {
    category: "Phones",
    name: "Xiaomi Redmi Note 13 Pro",
    description: "Value-focused smartphone with a 200MP main camera, curved AMOLED display, and fast 67W charging. A strong all-rounder for budget-conscious buyers who still want flagship-style features.",
    priceUSD: 299,
    imageDescription: "Front and back studio shot of the Redmi Note 13 Pro in Midnight Black, large circular camera module visible, plain white background."
  },
  {
    category: "Phones",
    name: "Motorola Edge 50 Pro",
    description: "Sleek mid-range phone with a curved pOLED display, 125W fast charging, and a vegan leather back option. Balances premium design with accessible pricing.",
    priceUSD: 599,
    imageDescription: "Front and back studio shot of the Motorola Edge 50 Pro in a textured vegan-leather black finish, plain white background."
  },

  // ---------------- NINTENDO (10) ----------------
  {
    category: "Nintendo",
    name: "Nintendo Switch 2",
    description: "Nintendo's current-generation hybrid console with a larger 7.9-inch 1080p HDR screen, upgraded Joy-Con 2 controllers, and backward compatibility with original Switch games. Play docked on the TV or handheld on the go.",
    priceUSD: 449.99,
    imageDescription: "Studio shot of the Nintendo Switch 2 console in its dock, connected to a TV silhouette in the background, Joy-Con 2 controllers attached on the sides, plain light background."
  },
  {
    category: "Nintendo",
    name: "Nintendo Switch OLED Model",
    description: "Original Switch hardware with a vivid 7-inch OLED screen, enhanced audio, and a wide adjustable kickstand. Still a great value pick for handheld and docked play.",
    priceUSD: 349.99,
    imageDescription: "Studio shot of the Switch OLED console standing upright on its kickstand with red and blue Joy-Con controllers attached, plain white background."
  },
  {
    category: "Nintendo",
    name: "Nintendo Switch Lite",
    description: "Compact, handheld-only version of the Switch with built-in controls and a lightweight body. Perfect for gaming on the go at a lower price point than the full console.",
    priceUSD: 199.99,
    imageDescription: "Studio shot of the Switch Lite in turquoise, held at a slight angle to show the built-in D-pad and buttons, plain white background."
  },
  {
    category: "Nintendo",
    name: "Nintendo Switch Pro Controller",
    description: "Full-size wireless controller with traditional grip, motion controls, and up to 40 hours of battery life. A comfortable alternative to Joy-Cons for extended play sessions.",
    priceUSD: 69.99,
    imageDescription: "Top-down studio shot of the black Nintendo Switch Pro Controller with the colorful button icons visible, plain white background."
  },
  {
    category: "Nintendo",
    name: "Joy-Con 2 Controller Pair",
    description: "Replacement or extra set of Joy-Con 2 controllers for the Nintendo Switch 2, featuring improved magnetic attachment and mouse-style motion controls for select games.",
    priceUSD: 94.99,
    imageDescription: "Studio shot of a red and blue Joy-Con 2 pair standing side by side, straps attached, plain white background."
  },
  {
    category: "Nintendo",
    name: "Nintendo Switch 2 Carrying Case",
    description: "Protective hard-shell case designed for the Switch 2 console and dock, with mesh pockets for games and cables. Keeps your console safe while traveling.",
    priceUSD: 29.99,
    imageDescription: "Studio shot of a black zip-up carrying case, partially open to show the Switch console fitted inside, plain white background."
  },
  {
    category: "Nintendo",
    name: "Mario Kart World (Switch 2)",
    description: "The latest entry in the Mario Kart series built exclusively for Switch 2, featuring an open connected world, new characters, and online multiplayer racing.",
    priceUSD: 79.99,
    imageDescription: "Front-facing studio shot of the Switch 2 game case standing upright, colorful cover art featuring karting characters, plain white background."
  },
  {
    category: "Nintendo",
    name: "The Legend of Zelda: Tears of the Kingdom",
    description: "Acclaimed open-world adventure sequel featuring Link exploring the skies and depths of Hyrule. A must-have physical Switch cartridge for fans of the franchise.",
    priceUSD: 69.99,
    imageDescription: "Front-facing studio shot of the Switch game case standing upright, cover art showing Link against a golden sky, plain white background."
  },
  {
    category: "Nintendo",
    name: "Donkey Kong Bananza (Switch 2)",
    description: "3D platforming adventure starring Donkey Kong, built to showcase the Switch 2's improved graphics with destructible environments and cooperative play.",
    priceUSD: 69.99,
    imageDescription: "Front-facing studio shot of the Switch 2 game case standing upright, cover art featuring Donkey Kong in a jungle setting, plain white background."
  },
  {
    category: "Nintendo",
    name: "Nintendo Switch 2 Dock Set",
    description: "Official replacement or spare dock for the Switch 2, allowing quick TV connection with HDMI and USB-C charging pass-through. Compact design matches the console.",
    priceUSD: 99.99,
    imageDescription: "Studio shot of the white Switch 2 dock standing empty, HDMI and USB-C ports visible on the back, plain white background."
  },

  // ---------------- XBOX (10) ----------------
  {
    category: "Xbox",
    name: "Xbox Series X",
    description: "Microsoft's most powerful console, delivering true 4K gaming at up to 120fps with ray tracing and near-instant load times via a custom NVMe SSD. Includes one Xbox Wireless Controller.",
    priceUSD: 599.99,
    imageDescription: "Studio shot of the tall black Xbox Series X tower standing upright, top vent visible, plain white background, soft even lighting."
  },
  {
    category: "Xbox",
    name: "Xbox Series S",
    description: "Compact, all-digital Xbox console offering next-gen speed and features at a more accessible price and size. Great entry point for 1440p gaming with fast load times.",
    priceUSD: 349.99,
    imageDescription: "Studio shot of the small white Xbox Series S standing upright, black circular vent on the front, plain white background."
  },
  {
    category: "Xbox",
    name: "Xbox Wireless Controller (Robot White)",
    description: "Official Xbox controller with a refined ergonomic shape, textured grips, and a hybrid D-pad. Connects via Bluetooth to Xbox consoles, PC, and mobile devices.",
    priceUSD: 64.99,
    imageDescription: "Top-down studio shot of the white Xbox Wireless Controller centered on a plain white background, clean symmetrical lighting."
  },
  {
    category: "Xbox",
    name: "Xbox Wireless Controller (Carbon Black)",
    description: "Same reliable Xbox controller design in a sleek matte black finish. Long battery life on two AA batteries or optional rechargeable battery pack.",
    priceUSD: 64.99,
    imageDescription: "Top-down studio shot of the black Xbox Wireless Controller centered on a plain white background."
  },
  {
    category: "Xbox",
    name: "Xbox Elite Wireless Controller Series 2",
    description: "Premium customizable controller with swappable thumbsticks, adjustable-tension triggers, and a rubberized grip. Built for competitive players who want maximum control.",
    priceUSD: 179.99,
    imageDescription: "Studio shot of the black Elite Series 2 controller with its carrying case open beside it showing the swappable component kit, plain white background."
  },
  {
    category: "Xbox",
    name: "Xbox Series X Vertical Stand",
    description: "Official accessory that lets you safely position your Xbox Series X vertically for better airflow and a smaller footprint. Simple tool-free installation.",
    priceUSD: 24.99,
    imageDescription: "Studio shot of the black plastic vertical stand alone on a plain white background, angled to show the console groove."
  },
  {
    category: "Xbox",
    name: "Xbox Play and Charge Kit",
    description: "Rechargeable battery pack and USB-C cable that clips onto your Xbox Wireless Controller, eliminating the need for disposable batteries.",
    priceUSD: 24.99,
    imageDescription: "Studio shot of a black battery pack attached to the back of an Xbox controller, USB-C cable coiled beside it, plain white background."
  },
  {
    category: "Xbox",
    name: "Halo Infinite",
    description: "The latest mainline entry in the Halo franchise, featuring an open-world campaign and free-to-play multiplayer modes. Physical Xbox Series X disc edition.",
    priceUSD: 39.99,
    imageDescription: "Front-facing studio shot of the Xbox game case standing upright, cover art featuring Master Chief, plain white background."
  },
  {
    category: "Xbox",
    name: "Forza Horizon 5",
    description: "Open-world racing game set in a vibrant recreation of Mexico, featuring hundreds of licensed cars and dynamic seasons. Physical Xbox Series X disc edition.",
    priceUSD: 49.99,
    imageDescription: "Front-facing studio shot of the Xbox game case standing upright, cover art showing a sports car kicking up dust, plain white background."
  },
  {
    category: "Xbox",
    name: "Xbox Game Pass Ultimate (3-Month Card)",
    description: "Digital subscription card granting access to hundreds of games on console, PC, and cloud, plus online multiplayer and EA Play. Redeemable code, no physical console required.",
    priceUSD: 44.99,
    imageDescription: "Studio shot of a green Xbox Game Pass Ultimate gift card standing upright against a plain white background."
  },

  // ---------------- TABLETS (10) ----------------
  {
    category: "Tablets",
    name: "Apple iPad 10th Generation",
    description: "Colorful, versatile tablet with a 10.9-inch Liquid Retina display and A14 Bionic chip. Great all-purpose choice for browsing, schoolwork, and light creative tasks.",
    priceUSD: 349,
    imageDescription: "Front-facing studio shot of the iPad 10th Gen in blue, standing upright on a stand, plain white background."
  },
  {
    category: "Tablets",
    name: "Apple iPad Air 13\" (M2)",
    description: "Powerful mid-size iPad with the M2 chip, a large 13-inch Liquid Retina display, and support for the Apple Pencil Pro. Ideal for creative work and productivity on the go.",
    priceUSD: 799,
    imageDescription: "Front-facing studio shot of the iPad Air 13-inch in space gray with an Apple Pencil resting beside it, plain white background."
  },
  {
    category: "Tablets",
    name: "Apple iPad Pro 11\" (M4)",
    description: "Apple's most advanced tablet, featuring the M4 chip, an Ultra Retina XDR tandem OLED display, and support for the Magic Keyboard and Apple Pencil Pro.",
    priceUSD: 999,
    imageDescription: "Front-facing studio shot of the iPad Pro 11-inch in silver, extremely thin profile shown from a side angle, plain white background."
  },
  {
    category: "Tablets",
    name: "Apple iPad mini (A17 Pro)",
    description: "Compact full-featured iPad with the A17 Pro chip, an 8.3-inch Liquid Retina display, and Apple Pencil Pro support. Perfect for reading, note-taking, and portability.",
    priceUSD: 499,
    imageDescription: "Front-facing studio shot of the iPad mini in purple, held in one hand to show its compact size, plain white background."
  },
  {
    category: "Tablets",
    name: "Samsung Galaxy Tab S9",
    description: "Premium Android tablet with a 11-inch Dynamic AMOLED 2X display, S Pen included in the box, and IP68 water resistance. Runs full desktop-style multitasking with DeX mode.",
    priceUSD: 799,
    imageDescription: "Front-facing studio shot of the Galaxy Tab S9 in graphite, S Pen resting on the display, plain white background."
  },
  {
    category: "Tablets",
    name: "Samsung Galaxy Tab A9+",
    description: "Affordable, everyday Android tablet with a large 11-inch display and quad speakers tuned by AKG. Great for streaming, browsing, and casual gaming.",
    priceUSD: 219,
    imageDescription: "Front-facing studio shot of the Galaxy Tab A9+ in silver, plain white background, angled to show the slim bezels."
  },
  {
    category: "Tablets",
    name: "Lenovo Tab M10 Plus (3rd Gen)",
    description: "Budget-friendly Android tablet with a full HD display and quad speakers with Dolby Atmos. A solid entry-level option for kids, students, and casual media consumption.",
    priceUSD: 179,
    imageDescription: "Front-facing studio shot of the Lenovo Tab M10 Plus in storm gray, plain white background."
  },
  {
    category: "Tablets",
    name: "Microsoft Surface Pro 10",
    description: "2-in-1 Windows tablet with a detachable keyboard option, vivid PixelSense touchscreen, and full desktop-class performance for productivity on the go.",
    priceUSD: 999,
    imageDescription: "Front-facing studio shot of the Surface Pro 10 with its kickstand out and keyboard attached, plain white background, angled three-quarter view."
  },
  {
    category: "Tablets",
    name: "Amazon Fire HD 10",
    description: "Value-oriented tablet with a 10.1-inch full HD display, long battery life, and built-in access to Alexa. A budget-friendly choice for streaming, reading, and web browsing.",
    priceUSD: 139.99,
    imageDescription: "Front-facing studio shot of the Fire HD 10 in black, plain white background, simple even lighting."
  },
  {
    category: "Tablets",
    name: "Huawei MatePad 11",
    description: "Slim, lightweight Android-based tablet with a 120Hz display and quad speaker setup. Good balance of performance and portability for everyday multimedia use.",
    priceUSD: 349,
    imageDescription: "Front-facing studio shot of the Huawei MatePad 11 in matte gray, plain white background."
  }
];

module.exports = { products, RATE };
