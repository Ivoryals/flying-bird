// One font for the entire project: p5 canvas, DOM interfaces and embedded screens.
const PAGMAR_MONO_FONT_FILE = "SimplerPro_HLAR_Mono-Regular 2.otf";
const PAGMAR_MONO_FONT_FAMILY = "SimplerPro_HLAR_Mono";

// Used only by the navigation bars and the bilingual project title.
const PAGMAR_DISPLAY_FONT_FILE = "AlfaBravo-medium.otf";
const PAGMAR_DISPLAY_FONT_FAMILY = "AlfaBravo-medium";

(function installPagmarMonoFontFace() {
  if (typeof document === "undefined") return;
  if (document.getElementById("pagmar-global-mono-font")) return;

  const style = document.createElement("style");
  style.id = "pagmar-global-mono-font";
  style.textContent = `
    @font-face {
      font-family: "SimplerPro_HLAR_Mono";
      src: url("SimplerPro_HLAR_Mono-Regular 2.otf") format("opentype");
      font-display: swap;
    }

    @font-face {
      font-family: "AlfaBravo-medium";
      src: url("AlfaBravo-medium.otf") format("opentype");
      font-style: normal;
      font-weight: 500;
      font-display: swap;
    }

    html, body, button, input, select, textarea, option {
      font-family: "SimplerPro_HLAR_Mono", monospace !important;
    }
  `;
  document.head.appendChild(style);
})();

let screenMode = "intro";
let transition = 0;
let transitionStarted = false;

let introStartTime = 0;
let introDelay = 1000;
let typeSpeed = 10;
let introLayoutReady = false;

let introAutoTransitionDelay = 3000;
let gridRevealStartTime = -1;
let gridRevealDuration = 3000;
let gridLetterFadeDuration = 520;

let designW = 560;
let designH = 260;

// High-resolution backing canvas for crisp typography on the 24-inch screen.
// The CSS size stays equal to the browser window; only the internal pixel
// resolution is doubled, so the interface does not become physically larger.
const SHARP_RENDER_DENSITY = 2;
let scaleFactor = 1;
let offsetX = 0;
let offsetY = 0;

let cols = 50;
let rows = 20;
let baseX = 0;
let baseY = 0;
let stepX = 7.45;
let stepY = 9.35;

// ---- Top bar (title / language toggle / found counter) ----
let uiLanguage = "he"; // "he" or "ar"
let langPillRects = { he: null, ar: null }; // retained for compatibility
let topNavRects = []; // touch-friendly hit areas for found-word navigation
let topTitleRect = null;

let mainFont;
let mainFontReady = false;
let homePopupFont;
let redColor;
let blueColor;
let blackColor;
let langToggleColor;
let openWordColor;

let currentSelection = [];
let foundWords = [];

let svgGridRows = []; // compatibility alias to the Hebrew layer
let hebrewGridRows = [];
let arabicGridRows = [];
let targetPlacements = {};

let gridSeed = 12;
let animatingGridChange = false;
let gridAnimationStartTime = 0;
let nextGridRows = []; // compatibility alias to next Hebrew layer
let nextHebrewGridRows = [];
let nextArabicGridRows = [];
let nextTargetPlacements = {};
let nextFoundWords = [];

// LANGUAGE / שפה / لغة rearrangement animation.
// This copies the smooth independent letter crossfades from the supplied
// recording sketch, but runs inside the main responsive word-search grid.
let languageMorphGrid = [];
let languageMorphFinalStarted = false;
let languageMorphFinalStartTime = 0;

const LANGUAGE_MORPH_CHANGE_DURATION = 3600;
const LANGUAGE_MORPH_FINAL_DURATION = 900;
const LANGUAGE_MORPH_MIN_CHANGE_INTERVAL = 150;
const LANGUAGE_MORPH_MAX_CHANGE_INTERVAL = 450;
const LANGUAGE_MORPH_MIN_FADE_DURATION = 100;
const LANGUAGE_MORPH_MAX_FADE_DURATION = 240;
const LANGUAGE_MORPH_HEBREW_COLOR = "#2ef5ff";
const LANGUAGE_MORPH_ARABIC_COLOR = "#ff3535";

let blurPopupOpen = false;
let homePopupOpen = false;
let homeVideo;
let homeVideoDomVisible = false;

// Full-screen scrollable HOME interface, created entirely from sketch.js.
let homeScreenRoot = null;
let homeScreenStyle = null;
let homeScreenVideos = [];

let homeVideoWindowX = null;
let homeVideoWindowY = null;
let homeTextWindowX = null;
let homeTextWindowY = null;
let homeVideoWindowVisible = true;
let homeTextWindowVisible = true;
let homePopupDragging = false;
let homePopupDragTarget = null;
let homePopupDragOffsetX = 0;
let homePopupDragOffsetY = 0;
let homePopupOpenStartedAt = -1;
let homePopupOpenDuration = 680;
let homePopupOriginX = 0;
let homePopupOriginY = 0;

let borderPopupOpen = false;
let borderActivePointId = null;
let borderImg;

// Full-screen scrollable BORDER interface, created entirely from sketch.js.
let borderScreenRoot = null;
let borderScreenStyle = null;
let borderScreenImagePanel = null;
let borderScreenTextPanel = null;
let borderScreenAudio = null;
let borderScreenImageRevealed = false;
let borderScreenTextRevealed = false;

// Points along the border constellation line. xFrac/yFrac are fractions of
// screen width/height (0..1) so it scales to any window size.
// type: "text" (bilingual paragraph), "sound" (audio icon), or "image" (photo).
let borderPoints = [
  { id: "point-text", xFrac: 0.42, yFrac: 0.815, type: "text" },
  { id: "point-sound", xFrac: 0.62, yFrac: 0.44, type: "sound" },
  { id: "point-image", xFrac: 0.87, yFrac: 0.185, type: "image" }
];

let clothesPopupOpen = false;
let clothesImageWindowX = null;
let clothesImageWindowY = null;
let clothesTextWindowX = null;
let clothesTextWindowY = null;
let clothesImageWindowVisible = true;
let clothesTextWindowVisible = true;
let clothesPopupDragging = false;
let clothesPopupDragTarget = null;
let clothesPopupDragOffsetX = 0;
let clothesPopupDragOffsetY = 0;
let clothesPopupOpenStartedAt = -1;
let clothesPopupOpenDuration = 680;
let clothesPopupOriginX = 0;
let clothesPopupOriginY = 0;
let clothesWithImg;
let clothesWithoutImg;
let clothesCompositeGfx;
let clothesCompositeReady = false;

// ---- Memory curtain effect state (ported from the standalone "Memory Curtain" sketch) ----
let memoryPopupOpen = false;
let memorySystemReady = false;
let memoryPointerEventsBound = false;

let memoryConfig;
let memoryTextRows = [];

let memoryParticles = [];
let memoryConstraints = [];
let memoryHorizontalConstraints = [];
let memoryPinnedParticles = [];

let memoryCharCanvases = {};
let memoryCellCanvases = {}; // connected Arabic word slices, one slice per moving column
let memoryHebrewRows = [];
let memoryArabicRows = [];

let memoryGrabbedParticle = null;
let memoryPointerIsDown = false;
let memoryPointerUpTimer = null;

let memoryPointerPos;
let memoryPointerPreviousPos = null;
let memoryPointerPreviousTime = 0;

// Smoothed touch-wind state. Touching no longer grabs a single character;
// the whole nearby cloth receives a soft breeze that follows finger movement.
let memoryBreezeDirection = { x: 1, y: 0 };
let memoryBreezeTargetDirection = { x: 1, y: 0 };
let memoryBreezeStrength = 0;
let memoryBreezeTargetStrength = 0;
let memoryBreezeLastMoveAt = 0;

let memoryLastTime = 0;

let memoryCanvasElement;

// Decorative SVG used by the redesigned memory interface.
// Keep curtain_holder.svg beside sketch.js.
let memoryCurtainHolderSvg = null;
let memoryCurtainHolderReady = false;

// Native browser microphone state.
// This does not depend on p5.sound or p5.AudioIn.
let memoryMic = null;
let memoryAudioContext = null;
let memoryMicSource = null;
let memoryMicStream = null;
let memoryMicData = null;
let memoryMicStarted = false;
let memoryMicPending = false;
let memoryMicError = false;

let memoryRawMicLevel = 0;
let memoryBlowAmount = 0;
let memoryBlowDisplay = 0;

const MEMORY_TARGET_GRID_ROWS = 45;
const MEMORY_TEXT_COLUMN_COUNT = 3;
const MEMORY_TEXT_COLUMN_WIDTH_CELLS = 12;
const MEMORY_TEXT_COLUMN_GAP_CELLS = 3;
const MEMORY_GRID_COLUMNS =
  MEMORY_TEXT_COLUMN_COUNT * MEMORY_TEXT_COLUMN_WIDTH_CELLS +
  (MEMORY_TEXT_COLUMN_COUNT - 1) * MEMORY_TEXT_COLUMN_GAP_CELLS;
const MEMORY_HEBREW_COLOR = "#2ef5ff";
const MEMORY_ARABIC_COLOR = "#ff3535";
const MEMORY_ARABIC_FONT_SCALE = 0.82;

// ---- Belonging "Temporary Rooms" doors state ----
let belongingPopupOpen = false;
let landPopupOpen = false;
let landVideo;
let belongingActiveDoorId = null;

// EMPTY SHELL: fill in imageFile / soundFile / videoFiles and textHebrew / textArabic
// for each door once you have the real files and writing ready.
// mediaType controls how the door renders its content: "image", "sound", or "video".
let belongingDoors = [
  {
    id: "village",
    labelHebrew: "הכפר",
    labelArabic: "القرية",
    mediaType: "image",
    imageFile: "",
    img: null,
    textHebrew: "",
    textArabic: "",
    status: "closed"
  },
  {
    id: "university",
    labelHebrew: "האוניברסיטה",
    labelArabic: "الجامعة",
    mediaType: "sound",
    soundFile: "",
    sound: null,
    textHebrew: "",
    textArabic: "",
    status: "closed"
  },
  {
    id: "haifa",
    labelHebrew: "חיפה",
    labelArabic: "حيفا",
    mediaType: "image",
    imageFile: "",
    img: null,
    textHebrew: "",
    textArabic: "",
    status: "closed"
  },
  {
    id: "family",
    labelHebrew: "המשפחה",
    labelArabic: "العائلة",
    mediaType: "video",
    videoFiles: [],
    video: null,
    textHebrew: "",
    textArabic: "",
    status: "closed"
  },
  {
    id: "digital",
    labelHebrew: "המרחב הדיגיטלי",
    labelArabic: "الفضاء الرقمي",
    mediaType: "sound",
    soundFile: "",
    sound: null,
    textHebrew: "",
    textArabic: "",
    status: "closed"
  }
];

let borderHebrewText = "הגבול משאיר אותי במקום תלוי, לא כאן לגמרי ולא שם. אני לא רוצה לחצות אותו, אבל אני לא מפסיקה לדמיין איך עיר הולדתי נראית מן הצד השני. אולי אותם הרים היו מרגישים אחרת משם. אולי הבית היה נראה אחרת. אני נשארת במקום שבו אני עומדת, אבל המבט שלי ממשיך לעבור מעבר לקו.";

let borderArabicText = "الحدّ يتركني في مكان معلّق، لست هنا تمامًا ولا هناك. لا أريد أن أعبره، لكنني لا أتوقف عن تخيّل كيف تبدو بلدتي من الجهة الأخرى. ربما تشعر الجبال نفسها بشكل مختلف من هناك. ربما يبدو البيت بمنظر آخر. أبقى في مكاني، لكن نظرتي تستمرّ في العبور إلى ما بعد الخط.";

let blurHebrewText = "טשטוש אינו חוסר בראייה, אלא דרך אחרת שבה האמת מופיעה. לפעמים דבר אינו לא ברור מפני שהוא רחוק, אלא מפני שהוא מחזיק יותר ממשמעות אחת באותו זמן. בין שפה לשפה, בין מקום למקום, התווים משתנים מעט, כאילו הדימוי מסרב להתקבע לצורה אחת. מה שאני רואה מצד אחד, עשוי להיראות אחרת מצד אחר. ומה שנראה מטושטש לאחרים, יכול להיות עבורי מדויק יותר מהבהירות עצמה. בתוך הטשטוש החלקים נשארים פתוחים, לא מוכרעים, ולא מתורגמים עד הסוף. זהו מרחב זמני בין היעלמות להופעה, בין להיראות לבין להיות מובן.";

let blurArabicText = "الضبابية ليست نقصًا في الرؤية، بل طريقة أخرى لظهور الحقيقة. أحيانًا لا يكون الشيء غير واضح لأنه بعيد، بل لأنه يحمل أكثر من معنى في الوقت نفسه. بين لغة وأخرى، بين مكان وآخر، تتغيّر الملامح قليلًا، كأن الصورة ترفض أن تثبت على شكل واحد. ما أراه من جهة، قد يبدو مختلفًا من جهة أخرى. وما يبدو مشوشًا للآخرين، قد يكون بالنسبة لي أكثر دقّة من الوضوح نفسه. في الضبابية تبقى الأجزاء مفتوحة، غير محسومة، وغير مترجمة بالكامل. إنها مساحة مؤقتة بين الاختفاء والظهور، بين أن أُرى وأن أُفهم.";

let homeArabicText = "البيت ليس مكانًا نعود إليه دائمًا، بل طقس يعرفنا قبل أن نسمّيه.\nقد يكون حركة هادئة، عادة تتكرر، أو لحظة تجعل الغربة أخف. هناك، لا يظهر البيت كعنوان، بل كشيء يبقى داخلنا.";

let homeHebrewText = "בית אינו מקום שאנו חוזרים אליו תמיד, אלא טקס שמכיר אותנו עוד לפני שאנו אפילו קוראים לו בשמו. יכול להיות תנועה שקטה, הרגל חוזר, או רגע שמקל את המרחק מהבית. שאינו מופיע ככתובת, אלא כמשהו שנשאר בתוכנו.";


let clothesArabicText = "كثيرًا ما يقرأني الناس من خلال مظهري قبل أن يعرفوا أي شيء عني. يخمّنون ديني، وأصلي، وما إذا كنت أبدو عربية بما يكفي. بين ما قد يتوقعه الناس وبين الطريقة التي أتحرك بها فعلًا في العالم، يصبح اللباس مساحة يحاول الآخرون من خلالها أن يعرّفوني.";

let clothesHebrewText = "לעיתים קרובות אנשים קוראים אותי דרך המראה שלי עוד לפני שהם יודעים עליי משהו. הם מנחשים את הדת שלי, את המוצא שלי, ואם אני נראית מספיק ערבייה. בין מה שאנשים מצפים לראות לבין האופן שבו אני באמת נעה בעולם, הלבוש הופך למרחב שדרכו אחרים מנסים להגדיר אותי.";

const MEMORY_SOURCE_TEXT = `
זיכרון הוא וילון התלוי מצד אחד; מה שנקבע למעלה דומה למקור שלא בחרנו, ומה שרועד למטה דומה לנו כשאנחנו מנסים לבנות את עצמנו משאריות מפוזרות. אני זוכרת בשתי שפות, ומאבדת את המשמעות ביניהן; כי הזיכרון שלי אינו רק מה שקרה, אלא מה שנותר לנוע בתוכי בכל פעם שאני מנסה לומר מי אני.

الذاكرة ستارة معلقة من طرف واحد؛ ما ثبت في الأعلى يشبه أصلا لا نختاره، وما يرتجف في الأسفل يشبهنا ونحن نحاول أن نبني أنفسنا من بقايا متفرقة. أتذكر بلغتين، وأفقد المعنى بينهما؛ فذاكرتي ليست ما حدث فقط، بل ما ظل يتحرك داخلي كلما حاولت أن أقول من أنا.
`;

let arabicTargetLabels = [
  "حدود",
  "بيت",
  "انعكاس",
  "ذاكرة",
  "أرض",
  "هوية",
  "ترجمة",
  "لغة",
  "انتماء"
];

let hebrewTargetLabels = [
  "גבול",
  "בית",
  "השתקפות",
  "זיכרון",
  "אדמה",
  "זהות",
  "תרגום",
  "שפה",
  "שייכות"
];

let targetWords = arabicTargetLabels.concat(hebrewTargetLabels);

let coreWordPairs = [
  { hebrew: "גבול", arabic: "حدود" },
  { hebrew: "בית", arabic: "بيت" },
  { hebrew: "השתקפות", arabic: "انعكاس" },
  { hebrew: "זיכרון", arabic: "ذاكرة" },
  { hebrew: "אדמה", arabic: "أرض" },
  { hebrew: "זהות", arabic: "هوية" },
  { hebrew: "תרגום", arabic: "ترجمة" },
  { hebrew: "שפה", arabic: "لغة" },
  { hebrew: "שייכות", arabic: "انتماء" }
];


let introWords = [
 { text: "Identity", x: 30, y: 78, colorType: "black" },
  { text: "is", x: 118, y: 78, colorType: "black" },
  { text: "never", x: 150, y: 78, colorType: "black" },
  { text: "found", x: 225, y: 78, colorType: "red" },
  { text: "whole.", x: 300, y: 78, colorType: "black" },

  { text: "It", x: 30, y: 98, colorType: "black" },
  { text: "appears", x: 62, y: 98, colorType: "black" },
  { text: "in", x: 150, y: 98, colorType: "black" },
  { text: "fragments,", x: 185, y: 98, colorType: "black" },

  { text: "like", x: 30, y: 118, colorType: "black" },
  { text: "puzzle", x: 82, y: 118, colorType: "black" },
  { text: "pieces.", x: 160, y: 118, colorType: "blue" },

  { text: "Look", x: 30, y: 152, colorType: "black" },
  { text: "closely.", x: 88, y: 152, colorType: "black" },

  { text: "Find", x: 30, y: 172, colorType: "black" },
  { text: "a", x: 88, y: 172, colorType: "black" },
  { text: "word", x: 112, y: 172, colorType: "red" },
  { text: "hidden", x: 178, y: 172, colorType: "black" },
  { text: "in", x: 260, y: 172, colorType: "black" },
  { text: "the", x: 295, y: 172, colorType: "black" },
  { text: "field.", x: 340, y: 172, colorType: "blue" }
];

let fillerLetters = [
  "א","ב","ג","ד","ה","ו","ז","ח","ט","י","כ","ל","מ","נ","ס","ע","פ","צ","ק","ר","ש","ת","ם","ן","ף","ץ",
  "ا","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي","ء","أ","إ","ة","ى"
];

const languageMorphHebrewLetters = [
  "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ", "ל", "מ",
  "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת", "ם", "ן", "ף", "ץ"
];

const languageMorphArabicLetters = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش",
  "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه",
  "و", "ي", "ء", "أ", "إ", "ة", "ى"
];



function setup() {
  if (typeof window !== "undefined") {
    window.__sketchDidSetup = true;
  }

  // Loaded here (not in preload) so a missing/slow file can never block
  // the whole sketch from starting. Each one fills in whenever it's ready.
  mainFont = loadFont(
    "SimplerPro_HLAR_Mono-Regular 2.otf",
    function() { console.log("OK: loaded SimplerPro_HLAR_Mono-Regular 2.otf"); mainFontReady = true; },
    function() { console.log("MISSING FILE: SimplerPro_HLAR_Mono-Regular 2.otf (put it in the same folder as sketch.js)"); mainFontReady = true; }
  );

  homePopupFont = loadFont(
    "SimplerPro_HLAR_Mono-Regular 2.otf",
    function() { console.log("OK: loaded SimplerPro_HLAR_Mono-Regular 2.otf"); },
    function() { console.log("MISSING FILE: SimplerPro_HLAR_Mono-Regular 2.otf (put it in the same folder as sketch.js)"); }
  );
  borderImg = null;

  clothesWithImg = loadImage(
    "me with.jpg",
    function() { console.log("OK: loaded me with.jpg"); },
    function() { console.log("MISSING FILE: me with.jpg (put it in the same folder as sketch.js)"); }
  );

  clothesWithoutImg = loadImage(
    "me without.png",
    function() { console.log("OK: loaded me without.png"); },
    function() { console.log("MISSING FILE: me without.png (put it in the same folder as sketch.js)"); }
  );

  pixelDensity(getSharpRenderDensity());
  createCanvas(windowWidth, windowHeight);
  configureSharpCanvasElement();
  smooth();

  // Ask the browser to prioritize precise text rasterization.
  drawingContext.textRendering = "geometricPrecision";
  drawingContext.imageSmoothingEnabled = true;

  // Preload the display face used only in the navigation bars and project title.
  if (typeof document !== "undefined" && document.fonts && typeof document.fonts.load === "function") {
    document.fonts.load('500 32px "AlfaBravo-medium"').catch(function() {});
  }

  introStartTime = millis();

  redColor = color(255, 0, 0);
  blueColor = color(0, 231, 255);
  blackColor = color(0);
  langToggleColor = color(30, 28, 118);
  openWordColor = color(255, 66, 0);

  loadMemoryCurtainHolderSvg();

  setupIntroLayout();

  randomSeed(gridSeed);
  generateRightToLeftGrid();

  // Core rendering setup runs right after the canvas exists and before any
  // optional media source (videos) is touched, so the grid/header always
  // get laid out no matter what happens with those below.
  calculateLayout();
  setupIpadTouchSupport();

  setupHomeScreenDom();
  setupBorderScreenDom();

  try {
    landVideo = createVideo(["IMG_1176.MOV"]);
    landVideo.hide();
    landVideo.volume(1);
    landVideo.elt.playsInline = true;
    landVideo.elt.loop = true;
    landVideo.elt.setAttribute("playsinline", "");
    landVideo.elt.addEventListener("error", function() {
      console.log("MISSING FILE: IMG_1176.MOV (put it in the same folder as sketch.js)");
    });
  } catch (err) {
    console.log("Land video unavailable:", err);
  }

  clothesCompositeReady = false;
}

function draw() {
  updateGridAnimation();
  updateIntroAutoTransition();

  if (belongingPopupOpen) {
    drawBelongingDoorsScreen();
    return;
  }

  if (borderPopupOpen) {
    drawBorderConstellationScreen();
    return;
  }

  if (landPopupOpen) {
    drawLandMinesweeperScreen();
    return;
  }

  background(238);

  if (screenMode === "game") {
    if (memoryPopupOpen) {
      drawMemoryTopBar(255);
    } else {
      drawTopBar(255);
    }
  } else if (screenMode === "intro" && transitionStarted) {
    drawTopBar(255 * transition);
  }

  if (memoryPopupOpen) {
    try {
      if (!memorySystemReady) {
        initMemorySystem();
      }

      if (memorySystemReady) {
        let now = millis();
        let delta = constrain(now - memoryLastTime, 1, 32);
        memoryLastTime = now;

        updateMemoryPhysics(delta);
      }
    } catch (err) {
      console.error("Memory Curtain crashed while updating — see the error above/below this line:", err);
      memoryPopupOpen = false;
    }
  }

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  if (screenMode === "intro") {
    if (!transitionStarted) {
      drawIntroScreen(255);
    } else {
      transition += 0.025;
      drawIntroScreen(255 * (1 - transition));
      drawGameGrid(255 * transition);

      if (transition >= 1) {
        screenMode = "game";
        transition = 1;
        beginGridReveal();
      }
    }
  } else {
    drawGameGrid(255);
  }

  pop();

  // Drawn in raw screen space (outside the scaled grid transform) so the
  // cloth simulation's own pixel-tuned physics stay unaffected by grid scale,
  // while still being confined to the grid region via getMemoryRegionBounds().
  if (memoryPopupOpen && memorySystemReady) {
    try {
      drawMemoryCode();
      drawMemoryCurtainHolder();
    } catch (err) {
      console.error("Memory Curtain crashed while drawing — see the error above/below this line:", err);
      memoryPopupOpen = false;
    }
  }

  updateHomeVideoDomOverlay();

  if (!homePopupOpen && homeScreenRoot && homeScreenRoot.style.display !== "none") {
    hideHomeScreenDomOnly();
  }
}

function setupIntroLayout() {
  let marginLeft = 28;
  let marginRight = 28;
  let marginTop = 38;
  let marginBottom = 38;

  let currentX = random(55, 165);
  let currentY = random(marginTop, marginTop + 24);
  let currentLineStartX = currentX;
  let highestUsedY = currentY;

  for (let i = 0; i < introWords.length; i++) {
    let word = introWords[i];
    let wordW = word.text.length * 3.3 + 3;

    if (i === 0) {
      word.x = currentX;
      word.y = currentY;
      word.w = wordW;
      continue;
    }

    let previousWord = introWords[i - 1];
    let canPlaceNext = previousWord.x + previousWord.w + 8 + wordW < designW - marginRight;
    let placeNext = random(1) < 0.62 && canPlaceNext;

    if (placeNext) {
      currentX = previousWord.x + previousWord.w + random(8, 24);
      currentY = max(previousWord.y + random(-1.2, 1.2), highestUsedY);
    } else {
      currentY = previousWord.y + random(10, 18);
      highestUsedY = currentY;

      let minX = max(marginLeft, currentLineStartX - 80);
      let maxX = min(designW - marginRight - wordW, currentLineStartX + 130);

      if (maxX < minX) {
        minX = marginLeft;
        maxX = designW - marginRight - wordW;
      }

      currentX = random(minX, maxX);
      currentLineStartX = currentX;

      if (currentY > designH - marginBottom) {
        let compression = (designH - marginBottom - marginTop) / max(1, currentY - marginTop);

        for (let j = 0; j < i; j++) {
          introWords[j].y = marginTop + (introWords[j].y - marginTop) * compression;
        }

        currentY = marginTop + (currentY - marginTop) * compression;
        highestUsedY = currentY;
      }
    }

    word.x = currentX;
    word.y = currentY;
    word.w = wordW;
  }

  introLayoutReady = true;
}

function generateRightToLeftGrid() {
  let result = createRightToLeftGridWithPlacements();
  hebrewGridRows = result.hebrewGrid;
  arabicGridRows = result.arabicGrid;
  svgGridRows = hebrewGridRows;
  targetPlacements = result.placements;
}

function createRightToLeftGridWithPlacements() {
  let hebrewResult = createSingleLanguageRightToLeftGrid(hebrewTargetLabels, languageMorphHebrewLetters);
  let arabicResult = createSingleLanguageRightToLeftGrid(arabicTargetLabels, languageMorphArabicLetters);

  let combinedPlacements = {};
  for (let key in hebrewResult.placements) combinedPlacements[key] = hebrewResult.placements[key];
  for (let key in arabicResult.placements) combinedPlacements[key] = arabicResult.placements[key];

  return {
    hebrewGrid: hebrewResult.grid,
    arabicGrid: arabicResult.grid,
    grid: hebrewResult.grid,
    placements: combinedPlacements
  };
}

function createSingleLanguageRightToLeftGrid(wordsToPlaceSource, fillerSource) {
  let newGrid = [];
  let newPlacements = {};
  let cellMap = {};

  for (let r = 0; r < rows; r++) {
    let row = [];

    for (let c = 0; c < cols; c++) {
      row.push(random(fillerSource));
    }

    newGrid.push(row);
  }

  let wordsToPlace = wordsToPlaceSource.slice();

  wordsToPlace.sort(function(a, b) {
    return normalizeWord(b).length - normalizeWord(a).length;
  });

  for (let word of wordsToPlace) {
    placeWordRightToLeftInGrid(word, newGrid, newPlacements, cellMap);
  }

  return {
    grid: newGrid,
    placements: newPlacements
  };
}

function placeWordRightToLeftInGrid(word, grid, placements, cellMap) {
  let cleanWord = normalizeWord(word);
  let letters = Array.from(cleanWord);
  let wordLength = letters.length;

  for (let attempts = 0; attempts < 1000; attempts++) {
    let r = floor(random(rows));
    let startC = floor(random(wordLength - 1, cols));
    let canPlace = true;

    for (let i = 0; i < wordLength; i++) {
      let c = startC - i;
      let key = r + "_" + c;

      if (cellMap[key] === true && grid[r][c] !== letters[i]) {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      let placementCells = [];

      for (let i = 0; i < wordLength; i++) {
        let c = startC - i;
        grid[r][c] = letters[i];
        cellMap[r + "_" + c] = true;
        placementCells.push(new SelectionCell(r, c));
      }

      placements[word] = placementCells;
      return;
    }
  }

  console.log("Could not place word:", word);
}

function updateIntroAutoTransition() {
  if (screenMode !== "intro" || transitionStarted) return;

  if (millis() - introStartTime > getIntroTypingEndTime() + introAutoTransitionDelay) {
    transitionStarted = true;
    beginGridReveal();
  }
}

function getIntroTypingEndTime() {
  let totalCharacters = 0;

  for (let item of introWords) {
    totalCharacters += item.text.length + 1;
  }

  return introDelay + (totalCharacters / typeSpeed) * 1000;
}

function beginGridReveal() {
  if (gridRevealStartTime < 0) {
    gridRevealStartTime = millis();
  }
}

function updateGridAnimation() {
  if (!animatingGridChange) return;

  const now = millis();
  const elapsed = now - gridAnimationStartTime;

  if (!languageMorphFinalStarted) {
    updateLanguageMorphRandomLetters(now);

    if (elapsed >= LANGUAGE_MORPH_CHANGE_DURATION) {
      languageMorphFinalStarted = true;
      languageMorphFinalStartTime = now;
    }

    return;
  }

  if (now - languageMorphFinalStartTime >= LANGUAGE_MORPH_FINAL_DURATION) {
    finishGridAnimation();
  }
}

function triggerLanguageRearrange() {
  if (animatingGridChange) return;

  let savedFoundWords = foundWords.map(function(fw) {
    return {
      word: fw.word,
      wordColor: fw.wordColor,
      createdAt: fw.createdAt
    };
  });

  // Generate a completely new placement for every hidden/found target word.
  gridSeed += 37;
  randomSeed(gridSeed);

  let result = createRightToLeftGridWithPlacements();
  nextHebrewGridRows = result.hebrewGrid;
  nextArabicGridRows = result.arabicGrid;
  nextGridRows = nextHebrewGridRows;
  nextTargetPlacements = result.placements;
  nextFoundWords = [];

  for (let item of savedFoundWords) {
    if (!nextTargetPlacements[item.word]) continue;

    let copiedCells = nextTargetPlacements[item.word].map(function(cell) {
      return new SelectionCell(cell.row, cell.col);
    });

    nextFoundWords.push(
      new FoundWord(copiedCells, item.word, item.wordColor, item.createdAt)
    );
  }

  // Start the copied casino-like crossfade animation in every fixed grid slot.
  createLanguageMorphGrid();
  currentSelection = [];
  animatingGridChange = true;
  gridAnimationStartTime = millis();
  languageMorphFinalStarted = false;
  languageMorphFinalStartTime = 0;
}

function createLanguageMorphGrid() {
  languageMorphGrid = [];
  const now = millis();

  // Use a fresh seed so each activation feels different while the final
  // placement remains deterministic through gridSeed above.
  randomSeed(Date.now() % 2147483647);

  for (let r = 0; r < rows; r++) {
    let rowStates = [];

    for (let c = 0; c < cols; c++) {
      rowStates.push({
        hebrew: createLanguageMorphLetterState(languageMorphHebrewLetters, now),
        arabic: createLanguageMorphLetterState(languageMorphArabicLetters, now)
      });
    }

    languageMorphGrid.push(rowStates);
  }
}

function createLanguageMorphLetterState(letterArray, now) {
  const currentLetter = random(letterArray);

  return {
    currentLetter: currentLetter,
    nextLetter: getDifferentLanguageMorphLetter(letterArray, currentLetter),
    transitionStart:
      now + random(
        LANGUAGE_MORPH_MIN_CHANGE_INTERVAL,
        LANGUAGE_MORPH_MAX_CHANGE_INTERVAL
      ),
    transitionDuration: random(
      LANGUAGE_MORPH_MIN_FADE_DURATION,
      LANGUAGE_MORPH_MAX_FADE_DURATION
    ),
    waiting: true,
    transitioning: false
  };
}

function updateLanguageMorphRandomLetters(now) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = languageMorphGrid[r] && languageMorphGrid[r][c];
      if (!cell) continue;

      updateLanguageMorphLetterState(cell.hebrew, languageMorphHebrewLetters, now);
      updateLanguageMorphLetterState(cell.arabic, languageMorphArabicLetters, now);
    }
  }
}

function updateLanguageMorphLetterState(state, letterArray, now) {
  if (!state) return;

  if (state.waiting && now >= state.transitionStart) {
    state.waiting = false;
    state.transitioning = true;
  }

  if (!state.transitioning) return;

  const endTime = state.transitionStart + state.transitionDuration;

  if (now >= endTime) {
    state.currentLetter = state.nextLetter;
    state.nextLetter = getDifferentLanguageMorphLetter(
      letterArray,
      state.currentLetter
    );
    state.transitionStart =
      now + random(
        LANGUAGE_MORPH_MIN_CHANGE_INTERVAL,
        LANGUAGE_MORPH_MAX_CHANGE_INTERVAL
      );
    state.transitionDuration = random(
      LANGUAGE_MORPH_MIN_FADE_DURATION,
      LANGUAGE_MORPH_MAX_FADE_DURATION
    );
    state.waiting = true;
    state.transitioning = false;
  }
}

function getDifferentLanguageMorphLetter(letterArray, currentLetter) {
  let nextLetter = random(letterArray);
  let attempts = 0;

  while (nextLetter === currentLetter && attempts < 20) {
    nextLetter = random(letterArray);
    attempts++;
  }

  return nextLetter;
}

function finishGridAnimation() {
  hebrewGridRows = nextHebrewGridRows;
  arabicGridRows = nextArabicGridRows;
  svgGridRows = hebrewGridRows;
  targetPlacements = nextTargetPlacements;
  foundWords = nextFoundWords;

  nextGridRows = [];
  nextHebrewGridRows = [];
  nextArabicGridRows = [];
  nextTargetPlacements = {};
  nextFoundWords = [];
  languageMorphGrid = [];

  currentSelection = [];
  animatingGridChange = false;
  languageMorphFinalStarted = false;
  languageMorphFinalStartTime = 0;
}

function drawLanguageRearrangeAnimation(alphaVal) {
  const now = millis();
  let finalProgress = 0;

  if (languageMorphFinalStarted) {
    const raw = constrain(
      (now - languageMorphFinalStartTime) / LANGUAGE_MORPH_FINAL_DURATION,
      0,
      1
    );
    finalProgress = raw * raw * (3 - 2 * raw);
  }

  push();
  textAlign(CENTER, CENTER);
  textSize(5.5);
  textFont(mainFont);
  noStroke();

  drawingContext.save();
  drawingContext.globalCompositeOperation = "multiply";
  drawingContext.textAlign = "center";
  drawingContext.textBaseline = "middle";
  drawingContext.textRendering = "geometricPrecision";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const visualPoint = cellToVisualPoint(r, c);
      const cell = languageMorphGrid[r] && languageMorphGrid[r][c];
      if (!cell) continue;

      const coloredAlpha = alphaVal * (1 - finalProgress);

      drawLanguageMorphChangingLetter(
        cell.hebrew,
        visualPoint.x + 0.34,
        visualPoint.y + 0.18,
        LANGUAGE_MORPH_HEBREW_COLOR,
        coloredAlpha,
        now
      );

      drawLanguageMorphChangingLetter(
        cell.arabic,
        visualPoint.x - 0.34,
        visualPoint.y - 0.18,
        LANGUAGE_MORPH_ARABIC_COLOR,
        coloredAlpha,
        now
      );

      // During the final copied transition, the new overlaid Hebrew/Arabic
      // grids fade in while the morph layers fade away.
      if (finalProgress > 0) {
        const finalAlpha = alphaVal * finalProgress;
        if (nextHebrewGridRows[r] && nextHebrewGridRows[r][c]) {
          fill(red(blueColor), green(blueColor), blue(blueColor), finalAlpha);
          text(nextHebrewGridRows[r][c], visualPoint.x + 0.34, visualPoint.y + 0.18);
        }
        if (nextArabicGridRows[r] && nextArabicGridRows[r][c]) {
          fill(red(redColor), green(redColor), blue(redColor), finalAlpha);
          text(nextArabicGridRows[r][c], visualPoint.x - 0.34, visualPoint.y - 0.18);
        }
      }
    }
  }

  drawingContext.restore();
  pop();
}

function drawLanguageMorphChangingLetter(
  state,
  x,
  y,
  letterColor,
  alphaLimit,
  now
) {
  if (!state || alphaLimit <= 1) return;

  if (state.waiting || !state.transitioning) {
    drawLanguageMorphLetter(
      state.currentLetter,
      x,
      y,
      letterColor,
      alphaLimit
    );
    return;
  }

  const progress = constrain(
    (now - state.transitionStart) / state.transitionDuration,
    0,
    1
  );
  const eased = progress * progress * (3 - 2 * progress);

  drawLanguageMorphLetter(
    state.currentLetter,
    x,
    y,
    letterColor,
    alphaLimit * (1 - eased)
  );

  drawLanguageMorphLetter(
    state.nextLetter,
    x,
    y,
    letterColor,
    alphaLimit * eased
  );
}

function drawLanguageMorphLetter(letter, x, y, letterColor, alphaValue) {
  if (!letter || alphaValue <= 1) return;

  const c = color(letterColor);
  c.setAlpha(constrain(alphaValue, 0, 255));
  fill(c);
  noStroke();
  text(letter, x, y);
}

function getHebrewGridLetter(r, c) {
  return hebrewGridRows[r] && hebrewGridRows[r][c] ? hebrewGridRows[r][c] : "";
}

function getArabicGridLetter(r, c) {
  return arabicGridRows[r] && arabicGridRows[r][c] ? arabicGridRows[r][c] : "";
}

function getAnimatedGridLetter(r, c) {
  return getHebrewGridLetter(r, c);
}

function getAnimatedCellColor(r, c) {
  return blueColor;
}

function getAnimatedFoundWordsForDrawing() {
  return foundWords;
}

function drawIntroScreen(alphaVal) {
  push();

  textAlign(LEFT, CENTER);
  textSize(5.5);
  textFont(mainFont);
  noStroke();

  if (!introLayoutReady) setupIntroLayout();

  let elapsed = millis() - introStartTime;
  let visibleCharacters = elapsed > introDelay ? floor(((elapsed - introDelay) / 1000) * typeSpeed) : 0;
  let usedCharacters = 0;

  for (let item of introWords) {
    let remaining = visibleCharacters - usedCharacters;

    if (remaining <= 0) break;

    let visiblePart = item.text.substring(0, min(item.text.length, remaining));
    let col = color(0, alphaVal);

    if (item.colorType === "red") col = color(255, 0, 0, alphaVal);
    if (item.colorType === "blue") col = color(0, 231, 255, alphaVal);

    fill(col);
    textFont(mainFont);
    text(visiblePart, item.x, item.y);

    usedCharacters += item.text.length + 1;
  }

  pop();
}

function drawGameGrid(alphaVal) {
  push();

  textAlign(CENTER, CENTER);
  textSize(5.5);
  textFont(mainFont);
  noStroke();

  if (!memoryPopupOpen) {
    if (animatingGridChange) {
      drawLanguageRearrangeAnimation(alphaVal);
    } else {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let visualPoint = cellToVisualPoint(r, c);
          let revealAlpha = getGridLetterRevealAlpha(r, c, alphaVal);
          revealAlpha *= getBorderAlphaMultiplierForCell(r, c);

          if (revealAlpha > 2) {
            drawOverlayGridCell(r, c, visualPoint.x, visualPoint.y, revealAlpha);
          }
        }
      }

      drawFoundWordCircles(alphaVal);
    }
  }

  if (memoryPopupOpen) {
    // The memory interface is a clean full-width screen. The ordinary grid
    // and word-list sidebar are deliberately hidden while it is open.
  } else if (homePopupOpen) {
    // HOME is rendered as a full-width, vertically scrollable DOM screen.
  } else if (clothesPopupOpen) {
    drawClothesFocusWash(alphaVal);
    drawTargetWordLabels(alphaVal);
    drawClothesPopups(alphaVal);
  } else {
    drawCurrentSelection(alphaVal);
    drawTargetWordLabels(alphaVal);
  }

  if (blurPopupOpen) {
    drawBlurPopup(alphaVal);
  }

  pop();
}

function drawOverlayGridCell(r, c, x, y, alphaVal) {
  let hebrewLetter = getHebrewGridLetter(r, c);
  let arabicLetter = getArabicGridLetter(r, c);

  if (hebrewLetter) {
    drawLetterWithEffects(hebrewLetter, r, c, x + 0.34, y + 0.18, blueColor, alphaVal);
  }

  if (arabicLetter) {
    drawLetterWithEffects(arabicLetter, r, c, x - 0.34, y - 0.18, redColor, alphaVal);
  }
}

function getGridLetterRevealAlpha(r, c, alphaVal) {
  if (gridRevealStartTime < 0) return alphaVal;

  let elapsed = millis() - gridRevealStartTime;
  let cellDelay = getGridLetterRevealDelay(r, c);
  let p = constrain((elapsed - cellDelay) / gridLetterFadeDuration, 0, 1);

  return alphaVal * easeOutCubic(p);
}

function getGridLetterRevealDelay(r, c) {
  let noiseValue = abs(sin((r + 1) * 31.17 + (c + 1) * 19.91) * 43758.5453);
  noiseValue = noiseValue - floor(noiseValue);

  let wave = (r / max(1, rows - 1)) * 0.35;
  let scattered = noiseValue * 0.65;

  return (wave + scattered) * gridRevealDuration;
}

function drawLetterWithEffects(letter, r, c, x, y, col, alphaVal) {
  let blurInfo = getBlurInfoForCell(r, c);

  if (blurInfo.active) {
    drawSmearedBlurLetter(letter, x, y, col, alphaVal, blurInfo.progress, blurInfo.index);
    return;
  }

  drawFlippableLetter(letter, x, y, col, alphaVal);
}

function drawFlippableLetter(letter, x, y, col, alphaVal) {
  let flipProgress = getReflectionFlipProgress();

  push();
  translate(x, y);

  if (flipProgress > 0) {
    scale(lerp(1, -1, flipProgress), 1);
  }

  fill(red(col), green(col), blue(col), alphaVal);
  textFont(mainFont);
  text(letter, 0, 0);

  pop();
}

function drawSmearedBlurLetter(letter, x, y, col, alphaVal, progress, index) {
  let t = millis() * 0.0024;
  let drift = sin(t + index * 0.7) * 0.35;
  let flipProgress = getReflectionFlipProgress();

  push();
  translate(x, y);

  if (flipProgress > 0) {
    scale(lerp(1, -1, flipProgress), 1);
  }

  textFont(mainFont);

  drawingContext.save();
  drawingContext.shadowBlur = 11 * progress;
  drawingContext.shadowColor =
    "rgba(" +
    floor(red(col)) + "," +
    floor(green(col)) + "," +
    floor(blue(col)) + "," +
    (0.58 * (alphaVal / 255)) +
    ")";

  noStroke();

  fill(red(col), green(col), blue(col), alphaVal * 0.24 * progress);
  text(letter, -0.35 + drift * 0.4, 1.3);
  text(letter, 0.15 - drift * 0.3, 2.1);
  text(letter, -0.1, 2.9);
  text(letter, 0.25, 3.7);
  text(letter, -0.18, 4.5);

  drawingContext.restore();

  fill(red(col), green(col), blue(col), alphaVal * 0.18 * progress);
  text(letter, -0.45, 0.95);
  text(letter, 0.35, 1.45);
  text(letter, -0.22, 2.15);

  fill(red(col), green(col), blue(col), alphaVal);
  text(letter, 0, 0);

  pop();
}



function drawFoundWordCircles(alphaVal) {
  let wordsToDraw = getAnimatedFoundWordsForDrawing();

  for (let fw of wordsToDraw) {
    if (!fw || !fw.cells || fw.cells.length === 0) continue;
    drawFoundWordCircle(fw.cells, fw.wordColor, alphaVal);
  }
}

function drawFoundWordCircle(cells, col, alphaVal) {
  // Keep the found word outline visually identical to the active selection outline.
  drawWordSelectionCapsule(cells, alphaVal);
}

function drawWordSelectionCapsule(cells, alphaVal) {
  let points = [];

  for (let cell of cells) {
    let p = cellToVisualPoint(cell.row, cell.col);
    points.push(p);
  }

  if (points.length === 0) return;

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (let p of points) {
    minX = min(minX, p.x);
    maxX = max(maxX, p.x);
    minY = min(minY, p.y);
    maxY = max(maxY, p.y);
  }

  // Same light feeling as the line while selecting.
  let sidePadding = stepX * 0.52;
let topBottomPadding = stepY * 0.36;  
  let dashLength = 4.6;
  let dashGap = 4.2;
  let lineWeight = 0.42;

  let boxX = minX - sidePadding;
  let boxY = minY - topBottomPadding;
  let boxW = (maxX - minX) + sidePadding * 2;
  let boxH = (maxY - minY) + topBottomPadding * 2;
  let radius = boxH / 2;

  let ctx = drawingContext;

  ctx.save();
  ctx.globalAlpha = alphaVal / 255;
  ctx.strokeStyle = "rgb(0,0,0)";
  ctx.lineWidth = lineWeight;
  ctx.setLineDash([dashLength, dashGap]);
  ctx.lineDashOffset = 0;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();

  ctx.moveTo(boxX + radius, boxY);
  ctx.lineTo(boxX + boxW - radius, boxY);
  ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
  ctx.lineTo(boxX + boxW, boxY + boxH - radius);
  ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH);
  ctx.lineTo(boxX + radius, boxY + boxH);
  ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - radius);
  ctx.lineTo(boxX, boxY + radius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);

  ctx.stroke();
  ctx.restore();
}

function getHomeVideoWindowBounds() {
  let defaultX = 125;
  let defaultY = 95;
  let w = 200;
  let h = 150;

  if (homeVideoWindowX === null) homeVideoWindowX = defaultX;
  if (homeVideoWindowY === null) homeVideoWindowY = defaultY;

  homeVideoWindowX = constrain(homeVideoWindowX, 0, designW - w);
  homeVideoWindowY = constrain(homeVideoWindowY, 0, designH - h);

  return { x: homeVideoWindowX, y: homeVideoWindowY, w: w, h: h };
}


function setupHomeScreenDom() {
  if (typeof document === "undefined") return;

  if (homeScreenRoot) {
    updateHomeScreenDomLayout();
    return;
  }

  homeScreenStyle = document.createElement("style");
  homeScreenStyle.id = "pagmar-home-screen-style";
  homeScreenStyle.textContent = `
    @font-face {
      font-family: "PagmarHome";
      src: url("SimplerPro_HLAR_Mono-Regular 2.otf") format("opentype");
      font-display: swap;
    }

    #pagmar-home-screen {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 7000;
      display: none;
      overflow-x: hidden;
      overflow-y: auto;
      background: #eeeeee;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y;
      scrollbar-width: none;
      font-family: "PagmarHome", "SimplerPro_HLAR_Mono", Arial, Tahoma, sans-serif;
    }

    #pagmar-home-screen::-webkit-scrollbar {
      display: none;
    }

    #pagmar-home-screen * {
      box-sizing: border-box;
    }

    .pagmar-home-intro {
      width: 100%;
      min-height: clamp(520px, 61vh, 680px);
      padding: clamp(44px, 6vh, 76px) 2.7vw clamp(76px, 9vh, 110px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      background: #eeeeee;
    }

    .pagmar-home-text-overlap {
      display: grid;
      width: 100%;
      max-width: 94vw;
      isolation: isolate;
      direction: rtl;
      text-align: center;
      font-size: clamp(45px, 5.55vw, 104px);
      line-height: 1.075;
      font-weight: 400;
      letter-spacing: -0.025em;
    }

    .pagmar-home-text-overlap > span {
      grid-area: 1 / 1;
      display: block;
      width: 100%;
      direction: rtl;
      unicode-bidi: plaintext;
      white-space: pre-line;
      text-align: center;
      mix-blend-mode: multiply;
      text-wrap: pretty;
    }

    .pagmar-home-text-hebrew {
      color: #2ef5ff;
      transform: translate(3px, 1.7px);
      z-index: 1;
    }

    .pagmar-home-text-arabic {
      color: #ff3535;
      transform: translate(-3px, -1.7px);
      z-index: 2;
    }

    .pagmar-home-scroll-arrow {
      position: relative;
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      margin-top: clamp(28px, 5vh, 58px);
      cursor: pointer;
      opacity: 0.72;
      touch-action: manipulation;
    }

    .pagmar-home-scroll-arrow::before,
    .pagmar-home-scroll-arrow::after {
      content: "";
      position: absolute;
      left: 50%;
      width: 15px;
      height: 15px;
      border-right: 1px solid #111111;
      border-bottom: 1px solid #111111;
      transform: translateX(-50%) rotate(45deg);
    }

    .pagmar-home-scroll-arrow::before { top: 0; }
    .pagmar-home-scroll-arrow::after { top: 9px; }

    .pagmar-home-videos {
      width: 100%;
      padding: 0 3.25vw clamp(44px, 6vw, 110px);
      background: #eeeeee;
    }

    .pagmar-home-video {
      display: block;
      width: 100%;
      border: 0;
      margin: 0;
      padding: 0;
      background: #d8d8d8;
      object-fit: cover;
      filter: grayscale(100%);
      -webkit-filter: grayscale(100%);
    }

    .pagmar-home-video-first {
      aspect-ratio: 2.075 / 1;
      object-position: center 48%;
    }

    .pagmar-home-video-second {
      aspect-ratio: 1.85 / 1;
      object-position: center center;
    }

    @media (max-width: 1100px) {
      .pagmar-home-intro {
        min-height: clamp(500px, 62vh, 640px);
        padding-inline: 3vw;
      }

      .pagmar-home-text-overlap {
        max-width: 95vw;
        font-size: clamp(42px, 5.6vw, 64px);
      }

      .pagmar-home-videos {
        padding-inline: 3.2vw;
      }
    }

    @media (orientation: portrait) {
      .pagmar-home-intro {
        min-height: 58vh;
      }

      .pagmar-home-text-overlap {
        font-size: clamp(36px, 6.8vw, 72px);
      }
    }
  `;
  document.head.appendChild(homeScreenStyle);

  homeScreenRoot = document.createElement("section");
  homeScreenRoot.id = "pagmar-home-screen";
  homeScreenRoot.setAttribute("aria-label", "בית / البيت");

  const intro = document.createElement("div");
  intro.className = "pagmar-home-intro";

  const overlap = document.createElement("div");
  overlap.className = "pagmar-home-text-overlap";

  const hebrewLayer = document.createElement("span");
  hebrewLayer.className = "pagmar-home-text-hebrew";
  hebrewLayer.lang = "he";
  hebrewLayer.dir = "rtl";
  hebrewLayer.textContent = homeHebrewText;

  const arabicLayer = document.createElement("span");
  arabicLayer.className = "pagmar-home-text-arabic";
  arabicLayer.lang = "ar";
  arabicLayer.dir = "rtl";
  arabicLayer.textContent = homeArabicText;

  overlap.appendChild(hebrewLayer);
  overlap.appendChild(arabicLayer);

  const arrow = document.createElement("div");
  arrow.className = "pagmar-home-scroll-arrow";
  arrow.setAttribute("role", "button");
  arrow.setAttribute("aria-label", "Scroll to videos");
  arrow.tabIndex = 0;

  const videos = document.createElement("div");
  videos.className = "pagmar-home-videos";

  const firstVideo = createHomeScreenVideo(
    "matte pour.mp4",
    "pagmar-home-video pagmar-home-video-first"
  );
  const secondVideo = createHomeScreenVideo(
    "aresh.mp4",
    "pagmar-home-video pagmar-home-video-second"
  );

  homeScreenVideos = [firstVideo, secondVideo];

  videos.appendChild(firstVideo);
  videos.appendChild(secondVideo);
  intro.appendChild(overlap);
  intro.appendChild(arrow);
  homeScreenRoot.appendChild(intro);
  homeScreenRoot.appendChild(videos);
  document.body.appendChild(homeScreenRoot);

  const scrollToVideos = function() {
    videos.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  arrow.addEventListener("click", scrollToVideos);
  arrow.addEventListener("keydown", function(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      scrollToVideos();
    }
  });

  updateHomeScreenDomLayout();
}

function createHomeScreenVideo(filename, className) {
  const video = document.createElement("video");
  video.className = className;
  video.src = filename;
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.controls = false;
  video.setAttribute("muted", "");
  video.setAttribute("loop", "");
  video.setAttribute("autoplay", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.addEventListener("error", function() {
    console.log("MISSING FILE: " + filename + " (put it beside sketch.js)");
  });
  return video;
}

function updateHomeScreenDomLayout() {
  if (!homeScreenRoot || typeof window === "undefined") return;
  const headerHeight = Math.round(getHeaderHeight());
  homeScreenRoot.style.top = headerHeight + "px";
  homeScreenRoot.style.height = Math.max(0, window.innerHeight - headerHeight) + "px";
}

function openHomeScreenDom() {
  setupHomeScreenDom();
  if (!homeScreenRoot) return;

  updateHomeScreenDomLayout();
  homeScreenRoot.style.display = "block";
  homeScreenRoot.scrollTop = 0;

  requestAnimationFrame(function() {
    playHomeScreenVideos();
  });
}

function playHomeScreenVideos() {
  for (let video of homeScreenVideos) {
    if (!video) continue;
    video.muted = true;
    try {
      const promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function() {});
      }
    } catch (error) {}
  }
}

function hideHomeScreenDomOnly() {
  for (let video of homeScreenVideos) {
    if (!video) continue;
    try { video.pause(); } catch (error) {}
  }

  if (homeScreenRoot) {
    homeScreenRoot.style.display = "none";
    homeScreenRoot.scrollTop = 0;
  }
}

function closeHomeScreenDom() {
  homePopupOpen = false;
  homePopupDragging = false;
  homePopupDragTarget = null;
  hideHomeScreenDomOnly();
}

function getHomeTextWindowBounds() {
  let defaultX = 296;
  let defaultY = 15;
  let w = 170;
  let h = 100;

  if (homeTextWindowX === null) homeTextWindowX = defaultX;
  if (homeTextWindowY === null) homeTextWindowY = defaultY;

  homeTextWindowX = constrain(homeTextWindowX, 0, designW - w);
  homeTextWindowY = constrain(homeTextWindowY, 0, designH - h);

  return { x: homeTextWindowX, y: homeTextWindowY, w: w, h: h };
}

function getHomeWindowHeaderH() {
  return 10;
}

function drawHomeFocusWash(alphaVal) {
  push();
  noStroke();
  fill(255, 222 * (alphaVal / 255));
  rect(0, 0, designW, designH);
  pop();
}

function drawHomePopups(alphaVal) {
  let videoB = getHomeVideoWindowBounds();
  let textB = getHomeTextWindowBounds();

  if (homeVideoWindowVisible) {
    drawHomeWindowWithGenie(videoB, alphaVal, function() {
      drawHomeVideoWindow(videoB, alphaVal);
    });
  }

  if (homeTextWindowVisible) {
    drawHomeWindowWithGenie(textB, alphaVal, function() {
      drawHomeTextWindow(textB, alphaVal);
    });
  }
}

function drawHomeWindowWithGenie(b, alphaVal, drawWindowFunction) {
  let openInfo = getHomePopupOpenInfo(b);

  push();
  translate(openInfo.currentCX, openInfo.currentCY);
  scale(openInfo.scaleX, openInfo.scaleY);
  translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
  drawWindowFunction();
  pop();
}

function getHomePopupOpenInfo(b) {
  let finalCX = b.x + b.w / 2;
  let finalCY = b.y + b.h / 2;

  if (homePopupOpenStartedAt < 0) {
    return { progress: 1, currentCX: finalCX, currentCY: finalCY, scaleX: 1, scaleY: 1 };
  }

  let rawP = constrain((millis() - homePopupOpenStartedAt) / homePopupOpenDuration, 0, 1);
  let p = easeOutCubic(rawP);
  let genieStretch = sin(rawP * PI) * 0.22;

  return {
    progress: rawP,
    currentCX: lerp(homePopupOriginX, finalCX, p),
    currentCY: lerp(homePopupOriginY, finalCY, p),
    scaleX: max(0.035, p),
    scaleY: max(0.025, p + genieStretch)
  };
}

function drawHomeFloatingWindowBase(b, alphaVal) {
  push();
  noStroke();
  fill(255, alphaVal);
  rect(b.x, b.y, b.w, b.h);
  pop();
}

function drawHomeHeaderOverlay(b, alphaVal) {
  push();
  noStroke();
  fill(255, 255);
  rect(b.x, b.y, b.w, getHomeWindowHeaderH());

  stroke(0, alphaVal * 0.13);
  strokeWeight(0.55);
  noFill();
  rect(b.x, b.y, b.w, b.h);
  line(b.x, b.y + getHomeWindowHeaderH(), b.x + b.w, b.y + getHomeWindowHeaderH());
  pop();
}

function drawHomeWindowClose(b, alphaVal) {
  push();
  noStroke();
  fill(0, alphaVal * 0.28);
  textFont(mainFont);
  textSize(7.2);
  textAlign(CENTER, CENTER);
  drawingContext.direction = "ltr";
  text("x", b.x + b.w - 6.5, b.y + 5);
  pop();
}

function drawHomeVideoWindow(b, alphaVal) {
  let headerH = getHomeWindowHeaderH();
  let contentX = b.x;
  let contentY = b.y + headerH;
  let contentW = b.w;
  let contentH = b.h - headerH;

  push();
  drawHomeFloatingWindowBase(b, alphaVal);
  noStroke();
  fill(235, alphaVal);
  rect(contentX, contentY, contentW, contentH);
  drawHomeVideo(contentX, contentY, contentW, contentH, alphaVal);
  drawHomeHeaderOverlay(b, alphaVal);
  drawHomeWindowClose(b, alphaVal);
  pop();
}

function drawHomeTextWindow(b, alphaVal) {
  let headerH = getHomeWindowHeaderH();
  let contentX = b.x;
  let contentY = b.y + headerH;
  let contentW = b.w;
  let contentH = b.h - headerH;

  push();
  drawHomeFloatingWindowBase(b, alphaVal);
  noStroke();
  fill(255, alphaVal);
  rect(contentX, contentY, contentW, contentH);
  drawSharedPopupTextBlock(contentX, contentY, contentW, contentH, homeArabicText, homeHebrewText, alphaVal, 11);
  drawHomeHeaderOverlay(b, alphaVal);
  drawHomeWindowClose(b, alphaVal);
  pop();
}

function getHomeCloseTarget(mx, my) {
  if (!homePopupOpen) return null;

  let p = screenToDesign(mx, my);
  let videoB = getHomeVideoWindowBounds();
  let textB = getHomeTextWindowBounds();

  if (homeVideoWindowVisible && dist(p.x, p.y, videoB.x + videoB.w - 6.5, videoB.y + 5) < 8) {
    return "video";
  }

  if (homeTextWindowVisible && dist(p.x, p.y, textB.x + textB.w - 6.5, textB.y + 5) < 8) {
    return "text";
  }

  return null;
}

function getHomeHeaderDragTarget(mx, my) {
  if (!homePopupOpen) return null;

  let p = screenToDesign(mx, my);
  let videoB = getHomeVideoWindowBounds();
  let textB = getHomeTextWindowBounds();

  if (homeVideoWindowVisible && isPointInsideRect(p.x, p.y, videoB.x, videoB.y, videoB.w, getHomeWindowHeaderH())) {
    return "video";
  }

  if (homeTextWindowVisible && isPointInsideRect(p.x, p.y, textB.x, textB.y, textB.w, getHomeWindowHeaderH())) {
    return "text";
  }

  return null;
}


function getSharedPopupTextSettings() {
  return {
    textSizeVal: 6.6,
    lineH: 8,
    textBlockW: 69,
    textStartOffsetY: 52,
    maxLines: 11
  };
}

function drawSharedPopupTextBlock(x, y, w, h, arabicText, hebrewText, alphaVal, maxLinesOverride, verticalPaddingOverride) {
  let settings = getSharedPopupTextSettings();

  // Same text SIZE settings as the clothes block.
  let textSizeVal = settings.textSizeVal;
  let lineH = settings.lineH;

  // Width stays unchanged. Only internal vertical padding can change.
  let textBlockW = min(settings.textBlockW, w - 22);

  let textCenterX = x + w / 2;
  let textLeftX = textCenterX - textBlockW / 2;
  let textRightX = textCenterX + textBlockW / 2;

  let arabicLines = getRTLConnectedLines(arabicText, textBlockW, textSizeVal);
  let hebrewLines = getRTLConnectedLines(hebrewText, textBlockW, textSizeVal);

  // Default is 4. Border can override this to reduce top/bottom padding.
  let verticalPadding = verticalPaddingOverride !== undefined ? verticalPaddingOverride : 4;

  let maxLinesByHeight = max(1, floor((h - verticalPadding * 2) / lineH));
  let maxLines = min(maxLinesByHeight, max(arabicLines.length, hebrewLines.length));

  let visibleCount = max(
    min(arabicLines.length, maxLines),
    min(hebrewLines.length, maxLines)
  );

  // Center inside the popup with the chosen top/bottom padding.
  let textStartY = y + h / 2 - ((visibleCount - 1) * lineH) / 2;

  drawingContext.save();
  drawingContext.globalCompositeOperation = "multiply";

  drawSharedJustifiedParagraph(
    arabicLines, textLeftX, textRightX - 0.5, textStartY, lineH,
    color(255, 0, 0), alphaVal, textSizeVal, maxLines, true
  );

  // Hebrew text is shifted further left relative to the Arabic text below.
  let hebrewShiftX = 5;

  drawSharedJustifiedParagraph(
    hebrewLines, textLeftX - hebrewShiftX, textRightX - hebrewShiftX, textStartY, lineH,
    color(0, 231, 255), alphaVal, textSizeVal, maxLines, false
  );

  drawingContext.restore();
}

function drawSharedJustifiedParagraph(lines, leftX, rightX, startY, lineH, col, alphaVal, sizeVal, maxVisibleLines, useKashida) {
  push();
  noStroke();

  let visibleCount = min(lines.length, maxVisibleLines);

  for (let i = 0; i < visibleCount; i++) {
    let line = lines[i];
    let y = startY + i * lineH;
    let words = line.trim().split(/\s+/);
    let isLastVisibleLine = i === visibleCount - 1;

    if (!isLastVisibleLine && words.length > 1) {
      if (useKashida) {
        drawClothesKashidaJustifiedRTLCanvasLine(words, leftX, rightX, y, sizeVal, col, alphaVal * 0.95);
      } else {
        drawClothesJustifiedRTLCanvasLine(words, leftX, rightX, y, sizeVal, col, alphaVal * 0.95);
      }
    } else {
      drawRTLCanvasText(line, rightX, y, sizeVal, col, alphaVal * 0.95, "right");
    }
  }

  pop();
}

function isClothesWord(word) {
  return word === "לבוש" || word === "ملابس";
}

function openClothesPopupFromCells(cells) {
  let origin = getCellsVisualCenter(cells);
  openClothesPopupFromPoint(origin.x, origin.y);
}

function openClothesPopupFromPoint(x, y) {
  clothesPopupOpen = true;
  clothesImageWindowVisible = true;
  clothesTextWindowVisible = true;
  clothesPopupDragging = false;
  clothesPopupDragTarget = null;
  clothesPopupOpenStartedAt = millis();
  clothesPopupOriginX = x;
  clothesPopupOriginY = y;
  homePopupOpen = false;
  borderPopupOpen = false;
  safePauseHomeVideo();
}

function getClothesImageWindowBounds() {
  let defaultX = 190;
  let defaultY = 70;
  let w = 126;
  let h = 178;

  if (clothesImageWindowX === null) clothesImageWindowX = defaultX;
  if (clothesImageWindowY === null) clothesImageWindowY = defaultY;

  clothesImageWindowX = constrain(clothesImageWindowX, 0, designW - w);
  clothesImageWindowY = constrain(clothesImageWindowY, 0, designH - h);

  return { x: clothesImageWindowX, y: clothesImageWindowY, w: w, h: h };
}

function getClothesTextWindowBounds() {
  let defaultX = 318;
  let defaultY = 40;
  let w = 136;
  let h = 178;

  if (clothesTextWindowX === null) clothesTextWindowX = defaultX;
  if (clothesTextWindowY === null) clothesTextWindowY = defaultY;

  clothesTextWindowX = constrain(clothesTextWindowX, 0, designW - w);
  clothesTextWindowY = constrain(clothesTextWindowY, 0, designH - h);

  return { x: clothesTextWindowX, y: clothesTextWindowY, w: w, h: h };
}

function getClothesWindowHeaderH() {
  return 10;
}

function drawClothesFocusWash(alphaVal) {
  push();
  noStroke();
  fill(255, 222 * (alphaVal / 255));
  rect(0, 0, designW, designH);
  pop();
}

function drawClothesPopups(alphaVal) {
  let imageB = getClothesImageWindowBounds();
  let textB = getClothesTextWindowBounds();

  if (clothesImageWindowVisible) {
    drawClothesWindowWithGenie(imageB, alphaVal, function() {
      drawClothesImageWindow(imageB, alphaVal);
    });
  }

  if (clothesTextWindowVisible) {
    drawClothesWindowWithGenie(textB, alphaVal, function() {
      drawClothesTextWindow(textB, alphaVal);
    });
  }
}

function drawClothesWindowWithGenie(b, alphaVal, drawWindowFunction) {
  let openInfo = getClothesPopupOpenInfo(b);

  push();
  translate(openInfo.currentCX, openInfo.currentCY);
  scale(openInfo.scaleX, openInfo.scaleY);
  translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
  drawWindowFunction();
  pop();
}

function getClothesPopupOpenInfo(b) {
  let finalCX = b.x + b.w / 2;
  let finalCY = b.y + b.h / 2;

  if (clothesPopupOpenStartedAt < 0) {
    return { progress: 1, currentCX: finalCX, currentCY: finalCY, scaleX: 1, scaleY: 1 };
  }

  let rawP = constrain((millis() - clothesPopupOpenStartedAt) / clothesPopupOpenDuration, 0, 1);
  let p = easeOutCubic(rawP);
  let genieStretch = sin(rawP * PI) * 0.22;

  return {
    progress: rawP,
    currentCX: lerp(clothesPopupOriginX, finalCX, p),
    currentCY: lerp(clothesPopupOriginY, finalCY, p),
    scaleX: max(0.035, p),
    scaleY: max(0.025, p + genieStretch)
  };
}

function drawClothesFloatingWindowBase(b, alphaVal) {
  push();
  noStroke();
  fill(255, alphaVal);
  rect(b.x, b.y, b.w, b.h);
  pop();
}

function drawClothesHeaderOverlay(b, alphaVal) {
  push();
  noStroke();
  fill(255, 255);
  rect(b.x, b.y, b.w, getClothesWindowHeaderH());

  stroke(0, alphaVal * 0.13);
  strokeWeight(0.55);
  noFill();
  rect(b.x, b.y, b.w, b.h);
  line(b.x, b.y + getClothesWindowHeaderH(), b.x + b.w, b.y + getClothesWindowHeaderH());
  pop();
}

function drawClothesWindowClose(b, alphaVal) {
  push();
  noStroke();
  fill(0, alphaVal * 0.28);
  textFont(mainFont);
  textSize(7.2);
  textAlign(CENTER, CENTER);
  drawingContext.direction = "ltr";
  text("x", b.x + b.w - 6.5, b.y + 5);
  pop();
}

function drawClothesImageWindow(b, alphaVal) {
  let headerH = getClothesWindowHeaderH();
  let contentX = b.x;
  let contentY = b.y + headerH;
  let contentW = b.w;
  let contentH = b.h - headerH;

  push();
  drawClothesFloatingWindowBase(b, alphaVal);
  noStroke();
  fill(235, alphaVal);
  rect(contentX, contentY, contentW, contentH);
  drawClothesMultiplyImages(contentX, contentY, contentW, contentH, alphaVal);
  drawClothesHeaderOverlay(b, alphaVal);
  drawClothesWindowClose(b, alphaVal);
  pop();
}

function drawClothesTextWindow(b, alphaVal) {
  let headerH = getClothesWindowHeaderH();
  let contentX = b.x;
  let contentY = b.y + headerH;
  let contentW = b.w;
  let contentH = b.h - headerH;

  push();
  drawClothesFloatingWindowBase(b, alphaVal);
  noStroke();
  fill(255, alphaVal);
  rect(contentX, contentY, contentW, contentH);
  drawClothesTextState(contentX, contentY, contentW, contentH, alphaVal);
  drawClothesHeaderOverlay(b, alphaVal);
  drawClothesWindowClose(b, alphaVal);
  pop();
}

function drawClothesMultiplyImages(x, y, w, h, alphaVal) {
  if (!clothesWithImg || !clothesWithoutImg) return;

  if (!clothesCompositeReady || !clothesCompositeGfx) {
    buildClothesCompositeCache();
  }

  let ctx = drawingContext;

  ctx.save();
  ctx.globalAlpha = alphaVal / 255;
  ctx.globalCompositeOperation = "source-over";

  // Draw the cached multiplied image proportionally.
  // This prevents free-transform distortion and keeps the image ratio clean.
  drawImageCoverToContext(ctx, clothesCompositeGfx, x, y, w, h);

  ctx.globalAlpha = 1;
  ctx.restore();
}

function buildClothesCompositeCache() {
  let imageB = getClothesImageWindowBounds();
  let headerH = getClothesWindowHeaderH();
  let contentW = imageB.w;
  let contentH = imageB.h - headerH;
  let targetRatio = contentW / contentH;

  // High-resolution cache with the same ratio as the popup content.
  // The cache is built once, then drawn proportionally every frame.
  let cacheW = 1200;
  let cacheH = round(cacheW / targetRatio);

  clothesCompositeGfx = createGraphics(cacheW, cacheH);
  clothesCompositeGfx.pixelDensity(getSharpRenderDensity());

  let ctx = clothesCompositeGfx.drawingContext;

  clothesCompositeGfx.push();
  clothesCompositeGfx.clear();
  clothesCompositeGfx.noStroke();
  clothesCompositeGfx.fill(235);
  clothesCompositeGfx.rect(0, 0, cacheW, cacheH);
  clothesCompositeGfx.pop();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  drawImageCoverToContext(ctx, clothesWithoutImg, 0, 0, cacheW, cacheH);
  ctx.globalCompositeOperation = "multiply";
  drawImageCoverToContext(ctx, clothesWithImg, 0, 0, cacheW, cacheH);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  clothesCompositeReady = true;
}

function drawClothesTextState(x, y, w, h, alphaVal) {
  push();
  drawSharedPopupTextBlock(x, y, w, h, clothesArabicText, clothesHebrewText, alphaVal, 11);
  pop();
}

function drawClothesKashidaJustifiedRTLCanvasLine(words, leftX, rightX, y, sizeVal, col, alphaVal) {
  let ctx = drawingContext;
  let targetW = rightX - leftX;

  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = getHomePopupCanvasFont(sizeVal);
  ctx.fillStyle = rgbaString(col, alphaVal);

  let kashidaWords = buildKashidaJustifiedWords(words, targetW, sizeVal);
  let wordWidths = [];
  let totalWordsW = 0;

  for (let i = 0; i < kashidaWords.length; i++) {
    let wordW = ctx.measureText(forceRTL(kashidaWords[i])).width;
    wordWidths.push(wordW);
    totalWordsW += wordW;
  }

  let gaps = kashidaWords.length - 1;
  let normalSpaceW = ctx.measureText(" ").width;
  let gapW = gaps > 0 ? (targetW - totalWordsW) / gaps : 0;

  // After kashida stretching, keep the remaining spaces natural.
  if (gapW < normalSpaceW) {
    gapW = normalSpaceW;
  }

  let x = rightX;

  for (let i = 0; i < kashidaWords.length; i++) {
    ctx.fillText(forceRTL(kashidaWords[i]), x, y);
    x -= wordWidths[i] + gapW;
  }

  ctx.restore();
}

function buildKashidaJustifiedWords(words, targetW, sizeVal) {
  let ctx = drawingContext;
  let output = words.slice();
  let normalSpaceW = ctx.measureText(" ").width;
  let maxIterations = 90;

  function lineWidth(currentWords) {
    let total = 0;

    for (let i = 0; i < currentWords.length; i++) {
      total += ctx.measureText(forceRTL(currentWords[i])).width;
    }

    total += max(0, currentWords.length - 1) * normalSpaceW;
    return total;
  }

  let currentW = lineWidth(output);
  let previousW = currentW;
  let cursor = 0;

  while (currentW < targetW - 0.9 && maxIterations > 0) {
    let changed = false;

    for (let step = 0; step < output.length; step++) {
      let idx = (cursor + step) % output.length;

      if (!canWordTakeKashida(output[idx])) continue;

      let candidateWord = addOneKashida(output[idx]);
      let candidate = output.slice();
      candidate[idx] = candidateWord;
      let candidateW = lineWidth(candidate);

      // Stop before the line becomes too wide.
      if (candidateW <= targetW + 0.6) {
        output = candidate;
        previousW = currentW;
        currentW = candidateW;
        cursor = idx + 1;
        changed = true;
        break;
      }
    }

    if (!changed || abs(currentW - previousW) < 0.01) break;
    maxIterations--;
  }

  return output;
}

function canWordTakeKashida(word) {
  return /[\u0600-\u06FF]/.test(word) && normalizeArabicForKashida(word).length > 2;
}

function normalizeArabicForKashida(word) {
  return word.replace(/[^\u0600-\u06FF]/g, "").replace(/ـ/g, "");
}

function addOneKashida(word) {
  let chars = Array.from(word);
  let preferredIndex = findKashidaInsertIndex(chars);

  if (preferredIndex < 0) {
    return word;
  }

  chars.splice(preferredIndex + 1, 0, "ـ");
  return chars.join("");
}

function findKashidaInsertIndex(chars) {
  // Avoid placing kashida after letters that do not connect forward.
  let nonConnecting = "اوأإآدذرزژىءة";
  let bestIndex = -1;

  for (let i = 0; i < chars.length - 1; i++) {
    let ch = chars[i];
    let next = chars[i + 1];

    if (!/[\u0600-\u06FF]/.test(ch)) continue;
    if (!/[\u0600-\u06FF]/.test(next)) continue;
    if (ch === "ـ" || next === "ـ") continue;
    if (nonConnecting.indexOf(ch) !== -1) continue;

    // Prefer middle positions, so the stretch feels typographic and not at the edge.
    if (i > 0 && i < chars.length - 2) {
      return i;
    }

    bestIndex = i;
  }

  return bestIndex;
}

function drawClothesJustifiedRTLCanvasLine(words, leftX, rightX, y, sizeVal, col, alphaVal) {
  let ctx = drawingContext;
  let totalWordsW = 0;
  let wordWidths = [];

  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = getHomePopupCanvasFont(sizeVal);
  ctx.fillStyle = rgbaString(col, alphaVal);

  for (let i = 0; i < words.length; i++) {
    let wordW = ctx.measureText(forceRTL(words[i])).width;
    wordWidths.push(wordW);
    totalWordsW += wordW;
  }

  let targetW = rightX - leftX;
  let gaps = words.length - 1;
  let gapW = gaps > 0 ? (targetW - totalWordsW) / gaps : 0;

  if (gapW < 0) {
    gapW = 0;
  }

  let x = rightX;

  for (let i = 0; i < words.length; i++) {
    ctx.fillText(forceRTL(words[i]), x, y);
    x -= wordWidths[i] + gapW;
  }

  ctx.restore();
}

function getClothesCloseTarget(mx, my) {
  if (!clothesPopupOpen) return null;

  let p = screenToDesign(mx, my);
  let imageB = getClothesImageWindowBounds();
  let textB = getClothesTextWindowBounds();

  if (clothesImageWindowVisible && dist(p.x, p.y, imageB.x + imageB.w - 6.5, imageB.y + 5) < 8) {
    return "image";
  }

  if (clothesTextWindowVisible && dist(p.x, p.y, textB.x + textB.w - 6.5, textB.y + 5) < 8) {
    return "text";
  }

  return null;
}

function getClothesHeaderDragTarget(mx, my) {
  if (!clothesPopupOpen) return null;

  let p = screenToDesign(mx, my);
  let imageB = getClothesImageWindowBounds();
  let textB = getClothesTextWindowBounds();

  if (clothesImageWindowVisible && isPointInsideRect(p.x, p.y, imageB.x, imageB.y, imageB.w, getClothesWindowHeaderH())) {
    return "image";
  }

  if (clothesTextWindowVisible && isPointInsideRect(p.x, p.y, textB.x, textB.y, textB.w, getClothesWindowHeaderH())) {
    return "text";
  }

  return null;
}

function openBorderPopupFromCells(cells) {
  openBorderConstellationScreen();
}

function setupBorderScreenDom() {
  if (borderScreenRoot || typeof document === "undefined") return;

  borderScreenStyle = document.createElement("style");
  borderScreenStyle.id = "pagmar-border-screen-style";
  borderScreenStyle.textContent = `
    @font-face {
      font-family: "PagmarSimpler";
      src: url("SimplerPro_HLAR_Mono-Regular 2.otf") format("opentype");
      font-display: swap;
    }

    .pagmar-border-screen {
      position: fixed;
      left: 0;
      width: 100vw;
      background: #141414;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      touch-action: pan-y;
      -webkit-overflow-scrolling: touch;
      z-index: 40;
      display: none;
      scrollbar-width: none;
    }

    .pagmar-border-screen::-webkit-scrollbar {
      display: none;
    }

    .pagmar-border-stage {
      position: relative;
      width: 100%;
      min-height: 100%;
      display: flex;
      justify-content: center;
      background: #141414;
      overflow: hidden;
    }

    .pagmar-border-image-panel {
      position: absolute;
      z-index: 1;
      top: 0;
      left: 0;
      width: 100%;
      height: clamp(430px, 58vw, 670px);
      overflow: hidden;
      background: #ffffff;
      opacity: 0;
      transform: translateY(-18px) scale(1.015);
      clip-path: inset(0 0 100% 0);
      transition:
        opacity 800ms cubic-bezier(.22,.82,.24,1),
        transform 1100ms cubic-bezier(.22,.82,.24,1),
        clip-path 1000ms cubic-bezier(.22,.82,.24,1);
      pointer-events: none;
    }

    .pagmar-border-image-panel.is-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      clip-path: inset(0 0 0 0);
    }

    .pagmar-border-image-panel img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
      display: block;
      mix-blend-mode: multiply;
      user-select: none;
      -webkit-user-drag: none;
    }

    .pagmar-border-board {
      --board-w: clamp(360px, 44.7vw, 560px);
      position: relative;
      z-index: 3;
      flex: 0 0 auto;
      width: var(--board-w);
      aspect-ratio: 846.14 / 2933.97;
      margin-top: clamp(28px, 3.5vh, 52px);
      margin-bottom: clamp(90px, 10vh, 150px);
    }

    .pagmar-border-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      pointer-events: none;
      user-select: none;
      -webkit-user-drag: none;
    }

    .pagmar-border-hotspot {
      position: absolute;
      z-index: 8;
      width: 82px;
      height: 82px;
      transform: translate(-50%, -50%);
      border: 0;
      border-radius: 50%;
      background: transparent;
      padding: 0;
      margin: 0;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    .pagmar-border-hotspot:focus-visible {
      outline: 1px solid rgba(255,255,255,.9);
      outline-offset: -14px;
    }

    .pagmar-border-hotspot-one {
      left: 77.5309%;
      top: 2.2856%;
    }

    .pagmar-border-hotspot-two {
      left: 89.0762%;
      top: 52.4131%;
    }

    .pagmar-border-hotspot-three {
      left: 71.3421%;
      top: 76.8089%;
    }

    .pagmar-border-text-panel {
      position: absolute;
      z-index: 5;
      left: -30%;
      top: 50.25%;
      width: 94%;
      display: grid;
      opacity: 0;
      transform: translate(-22px, 26px);
      clip-path: inset(0 0 0 100%);
      transition:
        opacity 720ms ease,
        transform 1100ms cubic-bezier(.16,.84,.22,1),
        clip-path 1000ms cubic-bezier(.16,.84,.22,1);
      pointer-events: none;
      isolation: isolate;
    }

    .pagmar-border-text-panel.is-visible {
      opacity: 1;
      transform: translate(0, 0);
      clip-path: inset(0 0 0 0);
    }

    .pagmar-border-text-layer {
      grid-area: 1 / 1;
      margin: 0;
      font-family: "SimplerPro_HLAR_Mono", monospace;
      font-size: clamp(15px, 1.05vw, 21px);
      line-height: 1.34;
      font-weight: 400;
      text-align: center;
      direction: rtl;
      unicode-bidi: plaintext;
      white-space: normal;
      mix-blend-mode: screen;
      text-wrap: pretty;
    }

    .pagmar-border-text-hebrew {
      color: #2ef5ff;
      transform: translate(1.4px, 1px);
      opacity: .92;
    }

    .pagmar-border-text-arabic {
      color: #ff3535;
      transform: translate(-1.4px, -1px);
      opacity: .92;
    }

    @media (max-width: 1100px) {
      .pagmar-border-board {
        --board-w: clamp(340px, 47vw, 500px);
      }

      .pagmar-border-text-panel {
        left: -22%;
        width: 92%;
      }
    }

    @media (max-width: 700px) {
      .pagmar-border-board {
        --board-w: min(67vw, 430px);
      }

      .pagmar-border-text-panel {
        left: -18%;
        width: 104%;
      }

      .pagmar-border-text-layer {
        font-size: clamp(13px, 2.3vw, 17px);
      }
    }
  `;
  document.head.appendChild(borderScreenStyle);

  borderScreenRoot = document.createElement("section");
  borderScreenRoot.className = "pagmar-border-screen";
  borderScreenRoot.setAttribute("aria-label", "גבול / حدّ");

  const stage = document.createElement("div");
  stage.className = "pagmar-border-stage";

  borderScreenImagePanel = document.createElement("div");
  borderScreenImagePanel.className = "pagmar-border-image-panel";

  const cyanImage = document.createElement("img");
  cyanImage.src = "border.jpg";
  cyanImage.alt = "Border image layer";

  const redImage = document.createElement("img");
  redImage.src = "no border.png";
  redImage.alt = "No-border image layer";
  redImage.addEventListener("error", function() {
    if (redImage.dataset.fallbackTried === "true") return;
    redImage.dataset.fallbackTried = "true";
    redImage.src = "no border(1).png";
  });

  borderScreenImagePanel.appendChild(cyanImage);
  borderScreenImagePanel.appendChild(redImage);

  const board = document.createElement("div");
  board.className = "pagmar-border-board";

  const borderSvg = document.createElement("img");
  borderSvg.className = "pagmar-border-svg";
  borderSvg.src = "border.svg";
  borderSvg.alt = "Border constellation path";

  borderScreenTextPanel = document.createElement("div");
  borderScreenTextPanel.className = "pagmar-border-text-panel";

  const hebrewText = document.createElement("p");
  hebrewText.className = "pagmar-border-text-layer pagmar-border-text-hebrew";
  hebrewText.lang = "he";
  hebrewText.dir = "rtl";
  hebrewText.textContent = borderHebrewText;

  const arabicText = document.createElement("p");
  arabicText.className = "pagmar-border-text-layer pagmar-border-text-arabic";
  arabicText.lang = "ar";
  arabicText.dir = "rtl";
  arabicText.textContent = borderArabicText;

  borderScreenTextPanel.appendChild(hebrewText);
  borderScreenTextPanel.appendChild(arabicText);

  const hotspotOne = createBorderScreenHotspot(
    "pagmar-border-hotspot-one",
    "Show border images",
    revealBorderScreenImages
  );

  const hotspotTwo = createBorderScreenHotspot(
    "pagmar-border-hotspot-two",
    "Show border text",
    revealBorderScreenText
  );

  const hotspotThree = createBorderScreenHotspot(
    "pagmar-border-hotspot-three",
    "Play border sound",
    playBorderScreenSound
  );

  board.appendChild(borderSvg);
  board.appendChild(borderScreenTextPanel);
  board.appendChild(hotspotOne);
  board.appendChild(hotspotTwo);
  board.appendChild(hotspotThree);

  stage.appendChild(borderScreenImagePanel);
  stage.appendChild(board);
  borderScreenRoot.appendChild(stage);
  document.body.appendChild(borderScreenRoot);

  borderScreenAudio = new Audio("drone.mp3");
  borderScreenAudio.preload = "auto";
  borderScreenAudio.loop = false;
  borderScreenAudio.addEventListener("error", function() {
    console.log("MISSING FILE: drone.mp3 (put it beside sketch.js)");
  });

  updateBorderScreenDomLayout();
}

function createBorderScreenHotspot(extraClass, label, onActivate) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pagmar-border-hotspot " + extraClass;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", function(event) {
    event.preventDefault();
    event.stopPropagation();
    onActivate();
  });
  return button;
}

function revealBorderScreenImages() {
  if (!borderScreenImagePanel) return;
  borderScreenImageRevealed = true;
  borderScreenImagePanel.classList.add("is-visible");
}

function revealBorderScreenText() {
  if (!borderScreenTextPanel) return;
  borderScreenTextRevealed = true;
  borderScreenTextPanel.classList.add("is-visible");
}

function playBorderScreenSound() {
  if (!borderScreenAudio) return;

  try {
    borderScreenAudio.currentTime = 0;
    const playPromise = borderScreenAudio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function() {});
    }
  } catch (error) {}
}

function resetBorderScreenDom() {
  borderScreenImageRevealed = false;
  borderScreenTextRevealed = false;

  if (borderScreenImagePanel) {
    borderScreenImagePanel.classList.remove("is-visible");
  }

  if (borderScreenTextPanel) {
    borderScreenTextPanel.classList.remove("is-visible");
  }

  if (borderScreenAudio) {
    try {
      borderScreenAudio.pause();
      borderScreenAudio.currentTime = 0;
    } catch (error) {}
  }

  if (borderScreenRoot) {
    borderScreenRoot.scrollTop = 0;
  }
}

function updateBorderScreenDomLayout() {
  if (!borderScreenRoot || typeof window === "undefined") return;
  const headerHeight = Math.round(getHeaderHeight());
  borderScreenRoot.style.top = headerHeight + "px";
  borderScreenRoot.style.height = Math.max(0, window.innerHeight - headerHeight) + "px";
}

function openBorderConstellationScreen() {
  setupBorderScreenDom();

  borderPopupOpen = true;
  borderActivePointId = null;

  memoryPopupOpen = false;
  homePopupOpen = false;
  clothesPopupOpen = false;
  blurPopupOpen = false;
  belongingPopupOpen = false;
  landPopupOpen = false;
  safePauseHomeVideo();

  resetBorderScreenDom();
  updateBorderScreenDomLayout();

  if (borderScreenRoot) {
    borderScreenRoot.style.display = "block";
    requestAnimationFrame(function() {
      borderScreenRoot.scrollTop = 0;
    });
  }
}

function closeBorderConstellationScreen() {
  borderActivePointId = null;
  borderPopupOpen = false;

  if (borderScreenAudio) {
    try {
      borderScreenAudio.pause();
      borderScreenAudio.currentTime = 0;
    } catch (error) {}
  }

  if (borderScreenRoot) {
    borderScreenRoot.style.display = "none";
    borderScreenRoot.scrollTop = 0;
  }
}

function drawBorderConstellationScreen() {
  background(20);
  drawTopBar(255);
  updateBorderScreenDomLayout();
}

function getBorderPointAt(mx, my) {
  return null;
}

function drawBorderExitButton() {
  // No extra close icon. The project title in the top bar returns to the grid.
}

function isInsideBorderExitButton(mx, my) {
  return false;
}

function isPointInsideRect(px, py, x, y, w, h) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function drawHomeVideo(x, y, w, h, alphaVal) {
  push();

  noStroke();
  fill(235, alphaVal);
  rect(x, y, w, h);

  if (homeVideo && homeVideo.elt) {
    drawingContext.save();
    drawingContext.globalAlpha = alphaVal / 255;

    // Black and white only. No RGB split, no glitch, no scan lines.
    drawingContext.filter = "grayscale(100%)";

    drawVideoCover(homeVideo, x, y, w, h);

    drawingContext.filter = "none";
    drawingContext.globalAlpha = 1;
    drawingContext.globalCompositeOperation = "source-over";
    drawingContext.restore();

    safeStartHomeVideo();
  }

  pop();
}

function setupHomeVideoDomOverlay() {
  if (!homeVideo || !homeVideo.elt) return;

  let v = homeVideo.elt;
  v.style.position = "absolute";
  v.style.display = "none";
  v.style.objectFit = "cover";
  v.style.filter = "grayscale(100%)";
  v.style.pointerEvents = "none";
  v.style.zIndex = "9999";
  v.style.background = "rgb(235,235,235)";
  v.style.transformOrigin = "top left";
}

function updateHomeVideoDomOverlay() {
  // Disabled: the home video is drawn directly inside the p5 popup now,
  // so it stays attached to the genie animation.
  if (!homeVideo || !homeVideo.elt) return;
  homeVideo.elt.style.display = "none";
  homeVideoDomVisible = false;
}

function drawVideoCover(videoObj, x, y, w, h) {
  drawVideoCoverToContext(drawingContext, videoObj, x, y, w, h);
}

function drawImageCoverToContext(ctx, img, x, y, w, h) {
  if (!img) return;

  let iw = img.width || w;
  let ih = img.height || h;

  if (iw <= 0 || ih <= 0) return;

  let sourceRatio = iw / ih;
  let targetRatio = w / h;

  let sx = 0;
  let sy = 0;
  let sw = iw;
  let sh = ih;

  if (sourceRatio > targetRatio) {
    sw = ih * targetRatio;
    sx = (iw - sw) / 2;
  } else {
    sh = iw / targetRatio;
    sy = (ih - sh) / 2;
  }

  ctx.drawImage(img.canvas || img.elt || img, sx, sy, sw, sh, x, y, w, h);
}

function drawVideoCoverToContext(ctx, videoObj, x, y, w, h) {
  if (!videoObj || !videoObj.elt) return;

  let vw = videoObj.elt.videoWidth || videoObj.width || w;
  let vh = videoObj.elt.videoHeight || videoObj.height || h;

  if (vw <= 0 || vh <= 0) return;

  let sourceRatio = vw / vh;
  let targetRatio = w / h;

  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;

  if (sourceRatio > targetRatio) {
    sw = vh * targetRatio;
    sx = (vw - sw) / 2;
  } else {
    sh = vw / targetRatio;
    sy = (vh - sh) / 2;
  }

  ctx.drawImage(videoObj.elt, sx, sy, sw, sh, x, y, w, h);
}

function drawRTLCanvasText(txt, x, y, sizeVal, col, alphaVal, alignVal) {
  let ctx = drawingContext;

  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = alignVal || "right";
  ctx.textBaseline = "middle";
  ctx.font = getHomePopupCanvasFont(sizeVal);
  ctx.fillStyle = rgbaString(col, alphaVal);
  ctx.fillText(forceRTL(txt), x, y);
  ctx.restore();
}

function getHomePopupCanvasFont(sizeVal) {
  return getSimplerCanvasFont(sizeVal);
}

function getSimplerCanvasFont(sizeVal) {
  return sizeVal + "px 'SimplerPro_HLAR_Mono', monospace";
}

function getAlfaBravoCanvasFont(sizeVal, useMediumWeight) {
  const weight = useMediumWeight === false ? "400" : "500";
  return weight + " " + sizeVal + "px 'AlfaBravo-medium', 'SimplerPro_HLAR_Mono', monospace";
}

function forceRTL(txt) {
  return "\u202B" + txt + "\u202C";
}

function getRTLConnectedLines(txt, maxW, sizeVal) {
  let ctx = drawingContext;

  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = getHomePopupCanvasFont(sizeVal);

  let words = txt.split(" ");
  let lines = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    let testLine = currentLine === "" ? words[i] : currentLine + " " + words[i];

    if (ctx.measureText(forceRTL(testLine)).width > maxW && currentLine !== "") {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine !== "") {
    lines.push(currentLine);
  }

  ctx.restore();

  return lines;
}

function drawBlurPopup(alphaVal) {
  let screenLeft = (0 - offsetX) / scaleFactor;
  let screenTop = (0 - offsetY) / scaleFactor;
  let screenW = width / scaleFactor;
  let screenH = height / scaleFactor;

  push();

  noStroke();
  fill(255, alphaVal);
  rect(screenLeft, screenTop, screenW, screenH);

  let closeX = screenLeft + screenW - 18;
  let closeY = screenTop + 14;

  fill(0, alphaVal);
  textFont(mainFont);
  textSize(9);
  textAlign(CENTER, CENTER);
  drawingContext.direction = "ltr";
  text("×", closeX, closeY);

  let centerX = screenLeft + screenW / 2;
  let centerY = screenTop + screenH / 2;
  let textMaxW = min(screenW - 170, 430);

  // Hebrew paragraph is shifted further left relative to the Arabic paragraph below.
  let blurHebrewShiftX = 8;

  drawRTLParagraph(blurHebrewText, centerX - blurHebrewShiftX, centerY - 35, textMaxW, 8.8, color(255, 0, 0), alphaVal, 7.5);
  drawRTLParagraph(blurArabicText, centerX, centerY - 35, textMaxW, 8.8, color(0, 231, 255), alphaVal, 7.5);

  pop();
}

function drawRTLParagraph(txt, centerX, startY, maxW, lineH, col, alphaVal, sizeVal) {
  push();

  textFont(mainFont);
  textSize(sizeVal);
  noStroke();
  fill(red(col), green(col), blue(col), alphaVal * 0.82);

  drawingContext.font = getSimplerCanvasFont(sizeVal);
  drawingContext.direction = "rtl";
  drawingContext.textAlign = "center";
  drawingContext.textBaseline = "middle";

  let words = txt.split(" ");
  let lines = [];
  let currentLine = "";

  for (let word of words) {
    let testLine = currentLine === "" ? word : currentLine + " " + word;

    if (drawingContext.measureText(testLine).width > maxW && currentLine !== "") {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine !== "") {
    lines.push(currentLine);
  }

  for (let i = 0; i < lines.length; i++) {
    drawingContext.fillStyle = rgbaString(col, alphaVal * 0.82);
    drawingContext.fillText(lines[i], centerX, startY + i * lineH);
  }

  drawingContext.direction = "ltr";
  drawingContext.textAlign = "left";

  pop();
}

function drawTopBar(alphaVal) {
  let h = getHeaderHeight();
  let leftPad = width * 0.037;
  let rightPad = width * 0.026;

  push();
  noStroke();

  if (borderPopupOpen) {
    stroke(255, 92 * (alphaVal / 255));
  } else {
    stroke(0, 60 * (alphaVal / 255));
  }
  strokeWeight(1);
  line(0, h, width, h);
  noStroke();

  // Left: found counter label in bilingual multiply + black count.
  let counterSize = constrain(height * 0.019, 13, 18);
  let countText = coreWordPairs.length + "/" + getFoundPairCount();
  drawTopBarCounterBlock(leftPad, h / 2, counterSize, countText, alphaVal);

  // Center: found words appear here as bilingual overlapping pairs.
  drawTopBarFoundPairs(alphaVal, null);

  // Right: project title.
  let titleSize = constrain(height * 0.043, 28, 44);
  drawTopBarBilingualWord(
    width - rightPad,
    h / 2,
    "ציפור מעופפת",
    "عصفور طاير",
    titleSize,
    alphaVal,
    "right",
    true
  );

  let titleW = measureBilingualPairWidth("ציפור מעופפת", "عصفور طاير", titleSize, true);
  topTitleRect = {
    x: width - rightPad - titleW - 26,
    y: h / 2 - max(48, titleSize * 1.35) / 2,
    w: titleW + 52,
    h: max(48, titleSize * 1.35)
  };

  langPillRects.ar = null;
  langPillRects.he = null;

  pop();
}

function drawTopBarCounterBlock(leftX, centerY, sizeVal, countText, alphaVal) {
  let labelW = measureBilingualPairWidth("נמצאו", "تم العثور", sizeVal);

  drawTopBarBilingualWord(
    leftX,
    centerY,
    "נמצאו",
    "تم العثور",
    sizeVal,
    alphaVal * 0.92,
    "left",
    false
  );

  drawingContext.save();
  drawingContext.direction = "ltr";
  drawingContext.textAlign = "left";
  drawingContext.textBaseline = "middle";
  drawingContext.font = getAlfaBravoCanvasFont(sizeVal, false);

  let countX = leftX + labelW + sizeVal * 1.25;

  if (borderPopupOpen) {
    drawingContext.globalCompositeOperation = "screen";
    drawingContext.fillStyle = rgbaString(color(MEMORY_HEBREW_COLOR), alphaVal * 0.94);
    drawingContext.fillText(countText, countX + 1.2, centerY + 0.7);
    drawingContext.fillStyle = rgbaString(color(MEMORY_ARABIC_COLOR), alphaVal * 0.94);
    drawingContext.fillText(countText, countX - 1.2, centerY - 0.7);
  } else {
    drawingContext.fillStyle = rgbaString(blackColor, alphaVal);
    drawingContext.fillText(countText, countX, centerY);
  }

  drawingContext.restore();
}

function drawTopBarFoundPairs(alphaVal, activePairId) {
  let h = getHeaderHeight();
  let sizeVal = constrain(height * 0.0205, 14, 20);
  let pairs = getFoundCorePairsInHeaderOrder(activePairId);

  topNavRects = [];
  if (pairs.length === 0) return;

  // Wide central navigation band designed for a 1920×1080 / 24-inch touch screen.
  let leftEdge = max(width * 0.22, 300);
  let rightEdge = min(width * 0.74, width - 390);
  let availableW = max(100, rightEdge - leftEdge);
  let step = pairs.length > 1 ? availableW / (pairs.length - 1) : 0;
  let minTouchH = max(46, h * 0.62);

  // RTL order: the first found pair sits on the right.
  for (let i = 0; i < pairs.length; i++) {
    let pair = pairs[i];
    let x = pairs.length === 1 ? (leftEdge + rightEdge) / 2 : rightEdge - i * step;
    let textW = measureBilingualPairWidth(pair.hebrew, pair.arabic, sizeVal, false);
    let touchW = max(68, min(step * 0.92, textW + 34));

    drawTopBarBilingualWord(
      x,
      h / 2,
      pair.hebrew,
      pair.arabic,
      sizeVal,
      alphaVal * 0.88,
      "center",
      false
    );

    topNavRects.push({
      x: x - touchW / 2,
      y: h / 2 - minTouchH / 2,
      w: touchW,
      h: minTouchH,
      pair: pair
    });
  }
}

function getFoundCorePairsInHeaderOrder(activePairId) {
  let result = [];

  for (let pair of coreWordPairs) {
    let pairId = pair.hebrew + "|" + pair.arabic;
    if (pairId === activePairId) continue;
    if (!hasFoundWord(pair.hebrew) && !hasFoundWord(pair.arabic)) continue;
    result.push(pair);
  }

  return result;
}

function measureBilingualPairWidth(hebrewText, arabicText, sizeVal, boldText) {
  let fontSpec = getAlfaBravoCanvasFont(sizeVal, boldText !== false);

  drawingContext.save();
  drawingContext.font = fontSpec;
  let w = max(
    drawingContext.measureText(hebrewText).width,
    drawingContext.measureText(arabicText).width
  );
  drawingContext.restore();

  return w;
}

function drawTopBarBilingualWord(x, y, hebrewText, arabicText, sizeVal, alphaVal, alignMode, boldText) {
  let fontSpec = getAlfaBravoCanvasFont(sizeVal, boldText !== false);

  drawingContext.save();
  drawingContext.globalCompositeOperation = borderPopupOpen ? "screen" : "multiply";
  drawingContext.direction = "rtl";
  drawingContext.textBaseline = "middle";
  drawingContext.font = fontSpec;

  if (alignMode === "right") {
    drawingContext.textAlign = "right";
  } else if (alignMode === "left") {
    drawingContext.textAlign = "left";
  } else {
    drawingContext.textAlign = "center";
  }

  drawingContext.fillStyle = rgbaString(color(MEMORY_HEBREW_COLOR), alphaVal);
  drawingContext.fillText(hebrewText, x + 2.1, y + 1.1);

  drawingContext.fillStyle = rgbaString(color(MEMORY_ARABIC_COLOR), alphaVal);
  drawingContext.fillText(arabicText, x - 2.1, y - 1.1);

  drawingContext.restore();
}

// Vertical rule separating the letter grid from the word-list column on the
// right, matching the reference. Drawn in raw screen space (like the top bar)
// so it stays a crisp straight line and runs from the header divider all the
// way to the bottom of the window, regardless of grid scale.
function drawSidebarDivider(alphaVal) {
  // Removed: found words now live in the top navigation.
}

function getSidebarDividerScreenX() {
  return width;
}

// The rectangle (in raw screen pixels) available for full-bleed content that
// replaces the letter grid — e.g. the memory curtain — while keeping the
// header, divider, and word-list sidebar all visible around it.
function getMemoryRegionBounds() {
  let headerH = getHeaderHeight();

  return {
    x: 0,
    y: headerH,
    w: width,
    h: height - headerH
  };
}

// Draws a right-aligned language label ending at rightX, centered vertically at y.
// If active, wraps it in a dashed rounded-rect pill. Returns the pill's bounding rect
// (in real screen pixels) for hit-testing, with .x being the LEFT edge.
function drawLangPill(label, rightX, y, textSizeVal, active, alphaVal) {
  drawingContext.direction = "rtl";
  drawingContext.textAlign = "right";
  drawingContext.textBaseline = "middle";
  drawingContext.font = getSimplerCanvasFont(textSizeVal);

  let textWidth = drawingContext.measureText(label).width;

  let padX = textSizeVal * 0.75;
  let padY = textSizeVal * 0.65;

  let rectRight = rightX + padX;
  let rectLeft = rightX - textWidth - padX;
  let rectW = rectRight - rectLeft;
  let rectH = textSizeVal + padY * 2;
  let rectY = y - rectH / 2;

  if (active) {
    drawingContext.save();
    drawingContext.strokeStyle = rgbaString(langToggleColor, alphaVal);
    drawingContext.lineWidth = 1;
    drawingContext.setLineDash([3, 3]);
    roundRectPath(drawingContext, rectLeft, rectY, rectW, rectH, rectH / 2);
    drawingContext.stroke();
    drawingContext.restore();
  }

  drawingContext.fillStyle = rgbaString(blackColor, alphaVal);
  drawingContext.fillText(label, rightX, y);

  return { x: rectLeft, y: rectY, w: rectW, h: rectH };
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getFoundPairCount() {
  let count = 0;

  for (let pair of coreWordPairs) {
    if (hasFoundWord(pair.hebrew) || hasFoundWord(pair.arabic)) {
      count++;
    }
  }

  return count;
}

function handleTopBarClick(mx, my) {
  if (my > getHeaderHeight()) return false;

  for (let i = 0; i < topNavRects.length; i++) {
    let rect = topNavRects[i];

    if (isPointInsideRect(mx, my, rect.x, rect.y, rect.w, rect.h)) {
      navigateToFoundPair(rect.pair);
      return true;
    }
  }

  if (
    topTitleRect &&
    isPointInsideRect(mx, my, topTitleRect.x, topTitleRect.y, topTitleRect.w, topTitleRect.h)
  ) {
    returnToMainGridFromNavigation();
    return true;
  }

  return false;
}

function navigateToFoundPair(pair) {
  if (!pair) return;

  let hebrew = pair.hebrew;
  let arabic = pair.arabic;

  // Close the currently open view before moving to another found word.
  returnToMainGridFromNavigation();

  if (isMemoryWord(hebrew) || isMemoryWord(arabic)) {
    openMemoryPopup();
    return;
  }

  if (isReflectionWord(hebrew) || isReflectionWord(arabic)) {
    if (typeof window !== "undefined" && typeof window.openReflectionTicket === "function") {
      window.openReflectionTicket();
    }
    return;
  }

  if (isHomeWord(hebrew) || isHomeWord(arabic)) {
    openHomePopupFromPoint(designW / 2, designH / 2);
    return;
  }

  if (isBorderWord(hebrew) || isBorderWord(arabic)) {
    openBorderConstellationScreen();
    return;
  }

  if (isBelongingWord(hebrew) || isBelongingWord(arabic)) {
    openBelongingDoorsScreen();
    return;
  }

  if (isLandWord(hebrew) || isLandWord(arabic)) {
    openLandMinesweeperScreen();
    return;
  }

  if (isIdentityWord(hebrew) || isIdentityWord(arabic)) {
    if (typeof window !== "undefined" && typeof window.openIdentityTicket === "function") {
      window.openIdentityTicket();
    }
    return;
  }

  if (hebrew === "שפה" || arabic === "لغة") {
    triggerLanguageRearrange();
  }
}

function returnToMainGridFromNavigation() {
  if (typeof closeReflectionTicket === "function" && typeof reflectionTicketOpen !== "undefined" && reflectionTicketOpen) {
    closeReflectionTicket();
  }

  if (memoryPopupOpen) closeMemoryPopup();
  if (borderPopupOpen && typeof closeBorderConstellationScreen === "function") closeBorderConstellationScreen();
  if (belongingPopupOpen && typeof closeBelongingDoorsScreen === "function") closeBelongingDoorsScreen();
  if (landPopupOpen && typeof closeLandMinesweeperScreen === "function") closeLandMinesweeperScreen();

  closeHomeScreenDom();
  clothesPopupOpen = false;
  blurPopupOpen = false;
  currentSelection = [];
}

function drawTargetWordLabels(alphaVal) {
  // Removed: the top bar is now the only found-word navigation.
}

function getRightReferenceWordList() {
  return [
    "حدود",
    "גבול",
    "بيت",
    "בית",
    "انعكاس",
    "השתקפות",
    "ذاكرة",
    "זיכרון",
    "أرض",
    "אדמה",
    "هوية",
    "זהות",
    "ترجمة",
    "תרגום",
    "لغة",
    "שפה",
    "انتماء",
    "שייכות"
  ];
}

function keyPressed() {
  if (borderPopupOpen && keyCode === ESCAPE) {
    closeBorderConstellationScreen();
    return false;
  }

  if (homePopupOpen && keyCode === ESCAPE) {
    closeHomeScreenDom();
    return false;
  }

  if (memoryPopupOpen && keyCode === ESCAPE) {
    closeMemoryPopup();
    return false;
  }
}

function mousePressed() {
  if ((screenMode === "game" || (screenMode === "intro" && transitionStarted)) && handleTopBarClick(mouseX, mouseY)) {
    return;
  }

  if (belongingPopupOpen) {
    if (isInsideBelongingExitButton(mouseX, mouseY)) {
      closeBelongingDoorsScreen();
      return;
    }

    if (belongingActiveDoorId) {
      let layout = getBelongingActivePanelLayout();
      let btn = getBelongingContinueButtonRect(layout);

      if (isPointInsideRect(mouseX, mouseY, btn.x, btn.y, btn.w, btn.h)) {
        closeBelongingActivePanel();
      }

      return;
    }

    let rects = getBelongingDoorRects();

    for (let r of rects) {
      if (isPointInsideRect(mouseX, mouseY, r.x, r.y, r.w, r.h)) {
        openBelongingDoor(r.door.id);
        return;
      }
    }

    return;
  }

  if (memoryPopupOpen) {
    // The design has no visible close icon. Clicking the bilingual project
    // title returns to the word-search grid without adding another element.
    if (mouseY <= getHeaderHeight() && mouseX >= width * 0.72) {
      closeMemoryPopup();
    }

    return;
  }

  if (clothesPopupOpen) {
    let clothesCloseTarget = getClothesCloseTarget(mouseX, mouseY);

    if (clothesCloseTarget !== null) {
      if (clothesCloseTarget === "image") clothesImageWindowVisible = false;
      if (clothesCloseTarget === "text") clothesTextWindowVisible = false;

      clothesPopupDragging = false;
      clothesPopupDragTarget = null;

      if (!clothesImageWindowVisible && !clothesTextWindowVisible) {
        clothesPopupOpen = false;
      }

      return;
    }

    let clothesTarget = getClothesHeaderDragTarget(mouseX, mouseY);

    if (clothesTarget !== null) {
      let p = screenToDesign(mouseX, mouseY);
      let b = clothesTarget === "image" ? getClothesImageWindowBounds() : getClothesTextWindowBounds();

      clothesPopupDragging = true;
      clothesPopupDragTarget = clothesTarget;
      clothesPopupDragOffsetX = p.x - b.x;
      clothesPopupDragOffsetY = p.y - b.y;
      return;
    }

    return;
  }

  if (borderPopupOpen) {
    if (isInsideBorderExitButton(mouseX, mouseY)) {
      closeBorderConstellationScreen();
      return;
    }

    let clickedPoint = getBorderPointAt(mouseX, mouseY);

    if (clickedPoint) {
      borderActivePointId = borderActivePointId === clickedPoint.id ? null : clickedPoint.id;
    } else {
      borderActivePointId = null;
    }

    return;
  }

  if (landPopupOpen) {
    if (isInsideLandExitButton(mouseX, mouseY)) {
      closeLandMinesweeperScreen();
    }

    return;
  }

  if (homePopupOpen) {
    let homeCloseTarget = getHomeCloseTarget(mouseX, mouseY);

    if (homeCloseTarget !== null) {
      if (homeCloseTarget === "video") {
        homeVideoWindowVisible = false;
        safePauseHomeVideo();
      }

      if (homeCloseTarget === "text") {
        homeTextWindowVisible = false;
      }

      homePopupDragging = false;
      homePopupDragTarget = null;

      if (!homeVideoWindowVisible && !homeTextWindowVisible) {
        homePopupOpen = false;
      }

      return;
    }

    let homeTarget = getHomeHeaderDragTarget(mouseX, mouseY);

    if (homeTarget !== null) {
      let p = screenToDesign(mouseX, mouseY);
      let b = homeTarget === "video" ? getHomeVideoWindowBounds() : getHomeTextWindowBounds();

      homePopupDragging = true;
      homePopupDragTarget = homeTarget;
      homePopupDragOffsetX = p.x - b.x;
      homePopupDragOffsetY = p.y - b.y;
    }

    return;
  }

  if (blurPopupOpen) {
    if (isInsideBlurPopupClose(mouseX, mouseY)) {
      blurPopupOpen = false;
    }

    return;
  }

  if (screenMode === "intro" && !transitionStarted) {
    transitionStarted = true;
    beginGridReveal();
    // No return here: this same click can also register as the start of a
    // letter selection below, instead of being spent purely on dismissing
    // the intro and leaving the user's first attempt invisible.
  }

  if ((screenMode === "game" || (screenMode === "intro" && transitionStarted)) && !animatingGridChange) {
    let clickedFoundWord = getFoundWordUnderMouse();

    if (clickedFoundWord !== null && isHomeWord(clickedFoundWord.word)) {
      openHomePopupFromCells(clickedFoundWord.cells);
      currentSelection = [];
      return;
    }

    if (clickedFoundWord !== null && isClothesWord(clickedFoundWord.word)) {
      openClothesPopupFromCells(clickedFoundWord.cells);
      currentSelection = [];
      return;
    }

    if (clickedFoundWord !== null && isMemoryWord(clickedFoundWord.word)) {
      openMemoryPopup();
      currentSelection = [];
      return;
    }

    if (clickedFoundWord !== null && isIdentityWord(clickedFoundWord.word)) {
      if (typeof window !== "undefined" && typeof window.openIdentityTicket === "function") {
        window.openIdentityTicket();
      }
      currentSelection = [];
      return;
    }

    if (clickedFoundWord !== null && isBelongingWord(clickedFoundWord.word)) {
      openBelongingDoorsScreen();
      currentSelection = [];
      return;
    }

    if (clickedFoundWord !== null && isLandWord(clickedFoundWord.word)) {
      openLandMinesweeperScreen();
      currentSelection = [];
      return;
    }

    if (clickedFoundWord !== null && clickedFoundWord.word === "טשטוש") {
      blurPopupOpen = true;
      currentSelection = [];
      return;
    }

    currentSelection = [];
    addCellUnderMouse();
  }
}

function mouseDragged() {
  if (belongingPopupOpen) return;
  if (memoryPopupOpen) return;
  if (borderPopupOpen) return;
  if (landPopupOpen) return;

  if (homePopupOpen && homePopupDragging) {
    let p = screenToDesign(mouseX, mouseY);

    if (homePopupDragTarget === "video") {
      let b = getHomeVideoWindowBounds();
      homeVideoWindowX = constrain(p.x - homePopupDragOffsetX, 0, designW - b.w);
      homeVideoWindowY = constrain(p.y - homePopupDragOffsetY, 0, designH - b.h);
    }

    if (homePopupDragTarget === "text") {
      let b = getHomeTextWindowBounds();
      homeTextWindowX = constrain(p.x - homePopupDragOffsetX, 0, designW - b.w);
      homeTextWindowY = constrain(p.y - homePopupDragOffsetY, 0, designH - b.h);
    }

    return;
  }

  if (clothesPopupOpen && clothesPopupDragging) {
    let p = screenToDesign(mouseX, mouseY);

    if (clothesPopupDragTarget === "image") {
      let b = getClothesImageWindowBounds();
      clothesImageWindowX = constrain(p.x - clothesPopupDragOffsetX, 0, designW - b.w);
      clothesImageWindowY = constrain(p.y - clothesPopupDragOffsetY, 0, designH - b.h);
    }

    if (clothesPopupDragTarget === "text") {
      let b = getClothesTextWindowBounds();
      clothesTextWindowX = constrain(p.x - clothesPopupDragOffsetX, 0, designW - b.w);
      clothesTextWindowY = constrain(p.y - clothesPopupDragOffsetY, 0, designH - b.h);
    }

    return;
  }

  if (!blurPopupOpen && !homePopupOpen && !borderPopupOpen && !clothesPopupOpen && (screenMode === "game" || (screenMode === "intro" && transitionStarted)) && !animatingGridChange) {
    addCellUnderMouse();
  }
}

function mouseReleased() {
  if (belongingPopupOpen) return;
  if (memoryPopupOpen) return;
  if (borderPopupOpen) return;
  if (landPopupOpen) return;

  if (homePopupDragging) {
    homePopupDragging = false;
    homePopupDragTarget = null;
    return;
  }

  if (clothesPopupDragging) {
    clothesPopupDragging = false;
    clothesPopupDragTarget = null;
    return;
  }

  if (!blurPopupOpen && !homePopupOpen && !borderPopupOpen && !clothesPopupOpen && (screenMode === "game" || (screenMode === "intro" && transitionStarted)) && !animatingGridChange) {
    checkSelection();
    currentSelection = [];
  }
}

function isInsideBlurPopupClose(mx, my) {
  if (!blurPopupOpen) return false;

  let p = screenToDesign(mx, my);
  let screenLeft = (0 - offsetX) / scaleFactor;
  let screenTop = (0 - offsetY) / scaleFactor;
  let screenW = width / scaleFactor;

  return dist(p.x, p.y, screenLeft + screenW - 18, screenTop + 14) < 10;
}

function addCellUnderMouse() {
  let p = screenToDesign(mouseX, mouseY);
  let nearestCell = getNearestVisualCell(p.x, p.y);

  if (nearestCell === null) return;

  if (currentSelection.length === 0) {
    currentSelection.push(nearestCell);
    return;
  }

  let first = currentSelection[0];

  // Only allow same-row selection.
  if (nearestCell.row !== first.row) return;

  // Either horizontal direction is fine — checkSelection() already matches
  // both the forward and reversed reading of the selection, so requiring a
  // specific start side here only made valid drags fail depending on which
  // end someone happened to start from.
  currentSelection = getCellsBetween(first.row, first.col, first.row, nearestCell.col);
}

function getNearestVisualCell(px, py) {
  let closestCell = null;
  let closestDistance = Infinity;
  let hitRadius = constrain(12 / max(scaleFactor, 0.001), 4.5, 12);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let visualPoint = cellToVisualPoint(r, c);
      let d = dist(px, py, visualPoint.x, visualPoint.y);

      if (d < closestDistance) {
        closestDistance = d;
        closestCell = new SelectionCell(r, c);
      }
    }
  }

  return closestDistance > hitRadius ? null : closestCell;
}

function checkSelection() {
  if (currentSelection.length < 2) return;

  let hebrewSelectedWord = normalizeWord(getWordFromCellsInGrid(currentSelection, hebrewGridRows));
  let hebrewReversedWord = normalizeWord(getReversedWordFromCellsInGrid(currentSelection, hebrewGridRows));
  let arabicSelectedWord = normalizeWord(getWordFromCellsInGrid(currentSelection, arabicGridRows));
  let arabicReversedWord = normalizeWord(getReversedWordFromCellsInGrid(currentSelection, arabicGridRows));

  for (let target of targetWords) {
    let normalizedTarget = normalizeWord(target);

    if (isArabicWord(target)) {
      if (arabicSelectedWord === normalizedTarget || arabicReversedWord === normalizedTarget) {
        addFoundWord(currentSelection, target);
        return;
      }
    } else {
      if (hebrewSelectedWord === normalizedTarget || hebrewReversedWord === normalizedTarget) {
        addFoundWord(currentSelection, target);
        return;
      }
    }
  }
}

function getWordFromCellsInGrid(cells, gridRows) {
  let word = "";

  for (let cell of cells) {
    if (gridRows[cell.row] && gridRows[cell.row][cell.col]) {
      word += gridRows[cell.row][cell.col];
    }
  }

  return word;
}

function getReversedWordFromCellsInGrid(cells, gridRows) {
  let word = "";

  for (let i = cells.length - 1; i >= 0; i--) {
    let cell = cells[i];
    if (gridRows[cell.row] && gridRows[cell.row][cell.col]) {
      word += gridRows[cell.row][cell.col];
    }
  }

  return word;
}

function safeStartHomeVideo() {
  playHomeScreenVideos();
  if (!homeVideo || !homeVideo.elt) return;

  let v = homeVideo.elt;
  v.muted = true;
  v.loop = true;
  v.playsInline = true;

  try {
    let playPromise = v.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function() {
        // Browser autoplay restrictions can reject play(); ignore instead of throwing/logging.
      });
    }
  } catch (err) {
    // Ignore media play errors so they do not break the sketch.
  }
}

function safePauseHomeVideo() {
  hideHomeScreenDomOnly();
  if (!homeVideo || !homeVideo.elt) return;

  try {
    homeVideo.elt.pause();
    homeVideo.elt.style.display = "none";
    homeVideoDomVisible = false;
  } catch (err) {
    // Ignore pause errors.
  }
}

function openHomePopupFromCells(cells) {
  let origin = getCellsVisualCenter(cells);
  openHomePopupFromPoint(origin.x, origin.y);
}

function openHomePopupFromPoint(x, y) {
  homePopupOpen = true;
  homePopupDragging = false;
  homePopupDragTarget = null;
  homePopupOpenStartedAt = millis();
  homePopupOriginX = x;
  homePopupOriginY = y;

  if (borderPopupOpen) closeBorderConstellationScreen();
  clothesPopupOpen = false;
  blurPopupOpen = false;

  openHomeScreenDom();
}

function getCellsVisualCenter(cells) {
  if (!cells || cells.length === 0) {
    return createVector(designW / 2, designH / 2);
  }

  let sx = 0;
  let sy = 0;

  for (let cell of cells) {
    let p = cellToVisualPoint(cell.row, cell.col);
    sx += p.x;
    sy += p.y;
  }

  return createVector(sx / cells.length, sy / cells.length);
}

function addFoundWord(cells, word) {
  if (alreadyFound(cells)) return;

  let wordColor = isArabicWord(word) ? redColor : blueColor;

  let copiedCells = cells.map(function(cell) {
    return new SelectionCell(cell.row, cell.col);
  });

  foundWords.push(new FoundWord(copiedCells, word, wordColor));

  if (isHomeWord(word)) {
    openHomePopupFromCells(copiedCells);
    currentSelection = [];
  }

  if (isBorderWord(word)) {
    openBorderPopupFromCells(copiedCells);
    currentSelection = [];
  }

  if (isClothesWord(word)) {
    openClothesPopupFromCells(copiedCells);
    currentSelection = [];
  }

  if (isMemoryWord(word)) {
    openMemoryPopup();
    currentSelection = [];
  }

  if (isIdentityWord(word)) {
    if (typeof window !== "undefined" && typeof window.openIdentityTicket === "function") {
      window.openIdentityTicket();
    }
    currentSelection = [];
  }

  if (isBelongingWord(word)) {
    openBelongingDoorsScreen();
    currentSelection = [];
  }

  if (isLandWord(word)) {
    openLandMinesweeperScreen();
    currentSelection = [];
  }

  if (word === "שפה" || word === "لغة") {
    triggerLanguageRearrange();
  }
}

function alreadyFound(cells) {
  for (let fw of foundWords) {
    if (fw.cells.length !== cells.length) continue;

    let sameForward = true;
    let sameReverse = true;

    for (let i = 0; i < cells.length; i++) {
      if (fw.cells[i].row !== cells[i].row || fw.cells[i].col !== cells[i].col) {
        sameForward = false;
      }

      let reverseCell = cells[cells.length - 1 - i];

      if (fw.cells[i].row !== reverseCell.row || fw.cells[i].col !== reverseCell.col) {
        sameReverse = false;
      }
    }

    if (sameForward || sameReverse) return true;
  }

  return false;
}

function getFoundWordUnderMouse() {
  let p = screenToDesign(mouseX, mouseY);
  let nearestCell = getNearestVisualCell(p.x, p.y);

  if (nearestCell === null) return null;

  for (let fw of foundWords) {
    for (let cell of fw.cells) {
      if (cell.row === nearestCell.row && cell.col === nearestCell.col) {
        return fw;
      }
    }
  }

  return null;
}

function getCellsBetween(r1, c1, r2, c2) {
  let cells = [];
  let dr = r2 - r1;
  let dc = c2 - c1;

  let stepR = dr > 0 ? 1 : dr < 0 ? -1 : 0;
  let stepC = dc > 0 ? 1 : dc < 0 ? -1 : 0;
  let length = max(abs(dr), abs(dc));

  for (let i = 0; i <= length; i++) {
    let rr = r1 + stepR * i;
    let cc = c1 + stepC * i;

    if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
      cells.push(new SelectionCell(rr, cc));
    }
  }

  return cells;
}

function drawCurrentSelection(alphaVal) {
  if (currentSelection.length === 0) return;

  drawWordSelectionCapsule(currentSelection, alphaVal);
}

function getSplitOffsetForCell(r, c) {
  let wordsToCheck = getAnimatedFoundWordsForDrawing();

  for (let fw of wordsToCheck) {
    if (!isSplitWord(fw.word)) continue;

    let matchingIndex = -1;

    for (let i = 0; i < fw.cells.length; i++) {
      if (fw.cells[i].row === r && fw.cells[i].col === c) {
        matchingIndex = i;
        break;
      }
    }

    if (matchingIndex === -1) continue;

    let splitProgress = easeOutCubic(constrain((millis() - fw.createdAt) / 900, 0, 1));

    let centerX = 0;
    let centerY = 0;

    for (let cell of fw.cells) {
      let p = cellToPoint(cell.row, cell.col);
      centerX += p.x;
      centerY += p.y;
    }

    centerX /= fw.cells.length;
    centerY /= fw.cells.length;

    let currentPoint = cellToPoint(r, c);
    let dxFromCenter = currentPoint.x - centerX;
    let directionX = dxFromCenter > 0 ? 1 : dxFromCenter < 0 ? -1 : matchingIndex - (fw.cells.length - 1) / 2;
    let indexDirection = matchingIndex - (fw.cells.length - 1) / 2;
    let breathing = sin(millis() * 0.003 + matchingIndex * 0.9) * 0.35;

    return createVector(
      directionX * 3.4 * splitProgress + directionX * breathing * splitProgress,
      indexDirection * 0.55 * splitProgress
    );
  }

  return createVector(0, 0);
}

function getBorderCutInfoForCell(r, c) {
  let progress = getBorderCutProgress();

  if (progress <= 0) {
    return {
      offset: createVector(0, 0),
      alphaMultiplier: 1
    };
  }

  let p = cellToPoint(r, c);
  let borderX = getVerticalBorderX(p.y);
  let distanceFromBorder = p.x - borderX;
  let absDistance = abs(distanceFromBorder);
  let side = distanceFromBorder < 0 ? -1 : 1;

  let pushInfluence = 1 - constrain(absDistance / 52, 0, 1);
  pushInfluence = pow(pushInfluence, 1.7);

  let gapInfluence = 1 - constrain(absDistance / 8, 0, 1);
  gapInfluence = pow(gapInfluence, 1.2);

  let microY = sin((r + 1) * 0.85 + (c + 1) * 0.42) * 0.35;

  return {
    offset: createVector(
      side * 8.5 * pushInfluence * progress,
      microY * pushInfluence * progress
    ),
    alphaMultiplier: 1 - gapInfluence * progress * 0.38
  };
}

function getBlurInfoForCell(r, c) {
  let wordsToCheck = getAnimatedFoundWordsForDrawing();

  for (let fw of wordsToCheck) {
    if (!isBlurWord(fw.word)) continue;

    for (let i = 0; i < fw.cells.length; i++) {
      if (fw.cells[i].row === r && fw.cells[i].col === c) {
        return {
          active: true,
          progress: easeOutCubic(constrain((millis() - fw.createdAt) / 900, 0, 1)),
          index: i
        };
      }
    }
  }

  return {
    active: false,
    progress: 0,
    index: -1
  };
}

function getBorderCutProgress() {
  // Border interaction removed - always inactive.
  return 0;
}

function getReflectionFlipProgress() {
  // Reflection interaction removed - always inactive.
  return 0;
}

function getVerticalBorderX(y) {
  return designW / 2 +
    sin(y * 0.055) * 9 +
    sin(y * 0.13 + 1.8) * 5 +
    sin(y * 0.025 - 0.7) * 7;
}

function hasFoundWord(wordToCheck) {
  for (let fw of foundWords) {
    if (fw.word === wordToCheck) return true;
  }

  return false;
}

function normalizeWord(word) {
  return word.replace(/\s+/g, "");
}

function getWordFromCells(cells) {
  return getWordFromCellsInGrid(cells, hebrewGridRows);
}

function getReversedWordFromCells(cells) {
  return getReversedWordFromCellsInGrid(cells, hebrewGridRows);
}

function getFoundWordColor(word) {
  for (let fw of foundWords) {
    if (fw.word === word) return fw.wordColor;
  }

  for (let fw of nextFoundWords) {
    if (fw.word === word) return fw.wordColor;
  }

  return blackColor;
}

function getBorderCutOffsetForCell(r, c) {
  return getBorderCutInfoForCell(r, c).offset;
}

function getBorderAlphaMultiplierForCell(r, c) {
  return getBorderCutInfoForCell(r, c).alphaMultiplier;
}

function cellToPoint(r, c) {
  return createVector(baseX + c * stepX, baseY + r * stepY);
}

function cellToVisualPoint(r, c) {
  let basePoint = cellToPoint(r, c);
  let splitOffset = getSplitOffsetForCell(r, c);
  let borderOffset = getBorderCutOffsetForCell(r, c);

  return createVector(
    basePoint.x + splitOffset.x + borderOffset.x,
    basePoint.y + splitOffset.y + borderOffset.y
  );
}

function screenToDesign(mx, my) {
  return createVector((mx - offsetX) / scaleFactor, (my - offsetY) / scaleFactor);
}

function getSharpRenderDensity() {
  // A fixed density of 2 gives the 1920×1080 exhibition screen a 3840×2160
  // internal canvas. This removes the soft text caused by pixelDensity(1).
  return SHARP_RENDER_DENSITY;
}

function configureSharpCanvasElement() {
  const canvasElement = document.querySelector("canvas");
  if (!canvasElement) return;

  // Prevent external CSS or Live Server's page shell from resampling the canvas.
  canvasElement.style.display = "block";
  canvasElement.style.width = windowWidth + "px";
  canvasElement.style.height = windowHeight + "px";
  canvasElement.style.maxWidth = "none";
  canvasElement.style.maxHeight = "none";
  canvasElement.style.imageRendering = "auto";
}

function alignToPhysicalPixel(value) {
  const density = getSharpRenderDensity();
  return Math.round(value * density) / density;
}

function calculateLayout() {
  // The sidebar has been removed. Center the actual 50×20 letter field inside
  // the full screen while preserving the original cell spacing and proportions.
  let gridPixelW = (cols - 1) * stepX;
  let gridPixelH = (rows - 1) * stepY;

  baseX = (designW - gridPixelW) / 2;
  baseY = (designH - gridPixelH) / 2;

  let headerH = getHeaderHeight();
  let availableHeight = height - headerH;

  // Leave a small touch-safe margin on all sides. At 1920×1080 this fills the
  // 24-inch display without pushing letters against the screen edges.
  let safeW = width * 0.94;
  let safeH = availableHeight * 0.92;

  scaleFactor = min(safeW / designW, safeH / designH);
  offsetX = alignToPhysicalPixel((width - designW * scaleFactor) / 2);
  offsetY = alignToPhysicalPixel(
    headerH + (availableHeight - designH * scaleFactor) / 2
  );
}

// Fixed-height bar (title / language toggle / found counter) reserved
// at the very top of the window, drawn outside the scaled design grid
// so its text always stays crisp regardless of grid scale.
function getHeaderHeight() {
  return constrain(height * 0.105, 56, 100);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  configureSharpCanvasElement();

  drawingContext.textRendering = "geometricPrecision";
  drawingContext.imageSmoothingEnabled = true;

  calculateLayout();
  updateBorderScreenDomLayout();
  updateHomeScreenDomLayout();

  if (memorySystemReady) {
    configureMemoryGrid();
    createMemorySystem();
  }
}

function rgbaString(col, alphaVal) {
  return "rgba(" +
    floor(red(col)) + "," +
    floor(green(col)) + "," +
    floor(blue(col)) + "," +
    (alphaVal / 255) +
  ")";
}

function isSplitWord(word) {
  return word === "פיצול" || word === "انقسام";
}

function isBorderWord(word) {
  return word === "גבול" || word === "حدود";
}

function isReflectionWord(word) {
  return word === "השתקפות" || word === "انعكاس" || word === "إنعكاس";
}

function isBlurWord(word) {
  return word === "טשטוש" ||
    word === "ضبابية" ||
    word === "ضبابي" ||
    word === "ضباب";
}

function isHomeWord(word) {
  return word === "בית" || word === "بيت";
}

function isMemoryWord(word) {
  return word === "זיכרון" || word === "ذاكرة";
}

function isIdentityWord(word) {
  return word === "זהות" || word === "هوية";
}

function isBelongingWord(word) {
  return word === "שייכות" || word === "انتماء";
}

function isLandWord(word) {
  return word === "אדמה" || word === "أرض";
}

// True while the popup/screen that this specific word opens is currently showing.
// Used by the sidebar list to highlight only the one "open" word in orange,
// while every other found word stays black.
function isWordCurrentlyOpen(word) {
  if (homePopupOpen && isHomeWord(word)) return true;
  if (clothesPopupOpen && isClothesWord(word)) return true;
  if (memoryPopupOpen && isMemoryWord(word)) return true;
  if (borderPopupOpen && isBorderWord(word)) return true;
  if (belongingPopupOpen && isBelongingWord(word)) return true;
  if (landPopupOpen && isLandWord(word)) return true;
  if (blurPopupOpen && isBlurWord(word)) return true;

  return false;
}

function isArabicWord(word) {
  return /[؀-ۿ]/.test(word);
}

function easeOutCubic(t) {
  return 1 - pow(1 - t, 3);
}

function easeInOutCubic(t) {
  if (t < 0.5) return 4 * t * t * t;

  return 1 - pow(-2 * t + 2, 3) / 2;
}

// ================================================================
// MEMORY CURTAIN EFFECT
// Ported from the standalone "Memory Curtain" p5.js sketch.
// Triggered in full-screen takeover mode when the word "memory"
// (זיכרון / ذاكرة) is found. All state/functions are prefixed with
// "memory" so nothing collides with the word-search game above.
// ================================================================

function openMemoryPopup() {
  memoryPopupOpen = true;
  memoryPointerIsDown = false;
  memoryPointerPreviousPos = null;
  memoryBreezeStrength = 0;
  memoryBreezeTargetStrength = 0;

  homePopupOpen = false;
  borderPopupOpen = false;
  clothesPopupOpen = false;
  blurPopupOpen = false;
  safePauseHomeVideo();

  if (!memorySystemReady) {
    try {
      initMemorySystem();
    } catch (err) {
      console.error("Memory Curtain failed to start — see the error above/below this line:", err);
      memoryPopupOpen = false;
      return;
    }
  }

  memoryLastTime = millis();

  // Ask for microphone access immediately while this function is still
  // running from the user's mouse/touch gesture. The pointer handler below
  // remains as a fallback if permission was not granted on the first try.
  startMemoryAudioInput();
}

function closeMemoryPopup() {
  memoryPopupOpen = false;
  memoryPointerIsDown = false;
  memoryPointerPreviousPos = null;
  memoryBreezeStrength = 0;
  memoryBreezeTargetStrength = 0;
}

function isInsideMemoryCloseButton(mx, my) {
  return false;
}

// ================================================================
// BELONGING "TEMPORARY ROOMS" DOORS
// A separate full-screen door, like memory/identity. Five rooms
// representing different contexts (village, university, Haifa,
// family, digital). Each door opens once and locks permanently.
// ================================================================

function openBelongingDoorsScreen() {
  belongingPopupOpen = true;

  memoryPopupOpen = false;
  homePopupOpen = false;
  borderPopupOpen = false;
  clothesPopupOpen = false;
  blurPopupOpen = false;
  safePauseHomeVideo();
}

function closeBelongingDoorsScreen() {
  closeBelongingActivePanel();
  belongingPopupOpen = false;
}

function openBelongingDoor(doorId) {
  let door = belongingDoors.find(function(d) {
    return d.id === doorId;
  });

  if (!door || door.status === "locked") return;

  // Opening a door uses it up permanently - it locks the moment it's opened.
  door.status = "locked";
  belongingActiveDoorId = doorId;

  startBelongingDoorMedia(door);
}

function closeBelongingActivePanel() {
  if (!belongingActiveDoorId) return;

  let door = belongingDoors.find(function(d) {
    return d.id === belongingActiveDoorId;
  });

  if (door) {
    stopBelongingDoorMedia(door);
  }

  belongingActiveDoorId = null;
}

function startBelongingDoorMedia(door) {
  if (door.mediaType === "sound" && door.sound && typeof door.sound.isLoaded === "function" && door.sound.isLoaded()) {
    door.sound.play();
  }

  if (door.mediaType === "video" && door.video && door.video.elt) {
    try {
      door.video.elt.muted = false;
      door.video.elt.currentTime = 0;

      let playPromise = door.video.elt.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function() {});
      }
    } catch (err) {
      // Ignore playback errors so they don't break the sketch.
    }
  }
}

function stopBelongingDoorMedia(door) {
  if (door.mediaType === "sound" && door.sound && typeof door.sound.isPlaying === "function" && door.sound.isPlaying()) {
    door.sound.stop();
  }

  if (door.mediaType === "video" && door.video && door.video.elt) {
    try {
      door.video.elt.pause();
    } catch (err) {
      // Ignore pause errors.
    }
  }
}

function getBelongingDoorRects() {
  let count = belongingDoors.length;
  let margin = width * 0.06;
  let gap = width * 0.02;
  let availableW = width - margin * 2 - gap * (count - 1);
  let doorW = availableW / count;
  let doorH = height * 0.5;
  let topY = height / 2 - doorH / 2;

  let rects = [];

  for (let i = 0; i < count; i++) {
    let x = margin + i * (doorW + gap);
    rects.push({ x: x, y: topY, w: doorW, h: doorH, door: belongingDoors[i] });
  }

  return rects;
}

function getBelongingActivePanelLayout() {
  let panelW = Math.min(width * 0.7, 720);
  let panelH = Math.min(height * 0.78, 640);
  let panelX = width / 2 - panelW / 2;
  let panelY = height / 2 - panelH / 2;

  return { panelX: panelX, panelY: panelY, panelW: panelW, panelH: panelH };
}

function getBelongingContinueButtonRect(layout) {
  let btnW = layout.panelW * 0.32;
  let btnH = layout.panelH * 0.07;
  let btnX = layout.panelX + layout.panelW / 2 - btnW / 2;
  let btnY = layout.panelY + layout.panelH - btnH - layout.panelH * 0.06;

  return { x: btnX, y: btnY, w: btnW, h: btnH };
}

function drawBelongingDoorsScreen() {
  background(255);

  if (belongingActiveDoorId) {
    drawBelongingActivePanel();
  } else {
    drawBelongingHallway();
  }

  drawBelongingExitButton();
}

function drawBelongingHallway() {
  let rects = getBelongingDoorRects();

  push();
  resetMatrix();
  textFont(mainFont);
  noStroke();

  fill(30);
  textAlign(CENTER, CENTER);
  textSize(Math.max(12, width * 0.014));
  drawingContext.direction = "rtl";
  text("כל דלת נפתחת פעם אחת בלבד", width / 2, height * 0.12);
  textSize(Math.max(11, width * 0.012));
  fill(90);
  text("كل باب يُفتح مرة واحدة فقط", width / 2, height * 0.12 + Math.max(18, width * 0.02));
  drawingContext.direction = "ltr";

  for (let r of rects) {
    let door = r.door;
    let locked = door.status === "locked";

    noStroke();
    fill(locked ? 225 : 250);
    rect(r.x, r.y, r.w, r.h);

    stroke(locked ? 190 : 20);
    strokeWeight(1.4);
    noFill();
    rect(r.x, r.y, r.w, r.h);

    noStroke();

    if (locked) {
      fill(150);
      textAlign(CENTER, CENTER);
      textSize(Math.max(16, r.w * 0.16));
      text("×", r.x + r.w / 2, r.y + r.h / 2);
    } else {
      fill(20);
      circle(r.x + r.w * 0.78, r.y + r.h / 2, Math.max(4, r.w * 0.05));
    }

    textAlign(CENTER, CENTER);
    drawingContext.direction = "rtl";
    fill(locked ? 140 : 20);
    textSize(Math.max(11, width * 0.012));
    text(door.labelHebrew, r.x + r.w / 2, r.y + r.h + 22);

    fill(locked ? 160 : 90);
    textSize(Math.max(10, width * 0.010));
    text(door.labelArabic, r.x + r.w / 2, r.y + r.h + 42);
    drawingContext.direction = "ltr";
  }

  pop();
}

function drawBelongingActivePanel() {
  let door = belongingDoors.find(function(d) {
    return d.id === belongingActiveDoorId;
  });

  if (!door) return;

  let layout = getBelongingActivePanelLayout();

  push();
  resetMatrix();

  noStroke();
  fill(255, 245);
  rect(0, 0, width, height);

  fill(255);
  stroke(20);
  strokeWeight(1.2);
  rect(layout.panelX, layout.panelY, layout.panelW, layout.panelH);

  noStroke();
  fill(20);
  textFont(mainFont);
  textAlign(CENTER, CENTER);
  textSize(Math.max(14, layout.panelW * 0.032));
  drawingContext.direction = "rtl";
  text(door.labelHebrew + " / " + door.labelArabic, width / 2, layout.panelY + layout.panelH * 0.08);
  drawingContext.direction = "ltr";

  let mediaTop = layout.panelY + layout.panelH * 0.15;
  let mediaH = layout.panelH * 0.34;

  if (door.mediaType === "image" && door.img) {
    imageMode(CENTER);

    let imgAspect = door.img.width / door.img.height;
    let boxAspect = (layout.panelW * 0.8) / mediaH;

    let drawW, drawH;

    if (imgAspect > boxAspect) {
      drawW = layout.panelW * 0.8;
      drawH = drawW / imgAspect;
    } else {
      drawH = mediaH;
      drawW = drawH * imgAspect;
    }

    image(door.img, width / 2, mediaTop + mediaH / 2, drawW, drawH);
    imageMode(CORNER);
  } else if (door.mediaType === "video" && door.video) {
    imageMode(CENTER);

    let vw = (door.video.elt && door.video.elt.videoWidth) || 640;
    let vh = (door.video.elt && door.video.elt.videoHeight) || 360;
    let vAspect = vw / vh;
    let boxAspect = (layout.panelW * 0.8) / mediaH;

    let drawW, drawH;

    if (vAspect > boxAspect) {
      drawW = layout.panelW * 0.8;
      drawH = drawW / vAspect;
    } else {
      drawH = mediaH;
      drawW = drawH * vAspect;
    }

    image(door.video, width / 2, mediaTop + mediaH / 2, drawW, drawH);
    imageMode(CORNER);
  } else if (door.mediaType === "sound" && door.sound) {
    noStroke();
    fill(230);
    rect(width / 2 - layout.panelW * 0.3, mediaTop, layout.panelW * 0.6, mediaH);

    fill(90);
    textAlign(CENTER, CENTER);
    textSize(Math.max(11, layout.panelW * 0.024));
    text("מתנגן / قيد التشغيل", width / 2, mediaTop + mediaH / 2);
  } else {
    noStroke();
    fill(240);
    rect(width / 2 - layout.panelW * 0.3, mediaTop, layout.panelW * 0.6, mediaH);

    fill(150);
    textAlign(CENTER, CENTER);
    textSize(Math.max(10, layout.panelW * 0.02));
    text("תוכן יתווסף בקרוב / سيُضاف المحتوى قريبًا", width / 2, mediaTop + mediaH / 2);
  }

  let textTop = mediaTop + mediaH + layout.panelH * 0.06;
  let textW = layout.panelW * 0.82;

  if (door.textHebrew || door.textArabic) {
    drawBelongingBilingualText(door.textHebrew, door.textArabic, width / 2, textTop, textW);
  }

  let btn = getBelongingContinueButtonRect(layout);

  noStroke();
  fill(20);
  rect(btn.x, btn.y, btn.w, btn.h);

  fill(255);
  textFont(mainFont);
  textAlign(CENTER, CENTER);
  textSize(Math.max(10, btn.w * 0.11));
  drawingContext.direction = "ltr";
  text("CONTINUE", btn.x + btn.w / 2, btn.y + btn.h / 2);

  pop();
}

function drawBelongingBilingualText(hebrewText, arabicText, centerX, startY, maxW) {
  let ctx = drawingContext;

  let fontSizeHeb = Math.max(13, maxW * 0.030);
  let fontSizeAr = Math.max(12, maxW * 0.027);

  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = getSimplerCanvasFont(fontSizeHeb);
  let hebLines = wrapBelongingText(hebrewText, maxW, ctx);
  let lineHHeb = fontSizeHeb * 1.55;

  ctx.fillStyle = "rgba(20,20,20,1)";
  let y = startY;

  for (let line of hebLines) {
    ctx.fillText(line, centerX, y);
    y += lineHHeb;
  }

  y += fontSizeHeb * 0.6;

  ctx.font = getSimplerCanvasFont(fontSizeAr);
  let arLines = wrapBelongingText(arabicText, maxW, ctx);
  let lineHAr = fontSizeAr * 1.55;

  ctx.fillStyle = "rgba(80,80,80,1)";

  for (let line of arLines) {
    ctx.fillText(line, centerX, y);
    y += lineHAr;
  }

  ctx.direction = "ltr";
}

function wrapBelongingText(txt, maxW, ctx) {
  let words = txt.split(" ");
  let lines = [];
  let current = "";

  for (let w of words) {
    let test = current === "" ? w : current + " " + w;

    if (ctx.measureText(test).width > maxW && current !== "") {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }

  if (current !== "") lines.push(current);

  return lines;
}

function drawBelongingExitButton() {
  push();
  resetMatrix();
  noStroke();
  fill(40, 40, 40, 200);
  textFont(mainFont);
  textSize(16);
  textAlign(CENTER, CENTER);
  drawingContext.direction = "ltr";
  text("×", width - 24, 24);
  pop();
}

function isInsideBelongingExitButton(mx, my) {
  if (!belongingPopupOpen) return false;

  return dist(mx, my, width - 24, 24) < 14;
}

// ================================================================
// LAND / MINESWEEPER SCREEN
// Triggered by "אדמה" / "أرض". Video on the left (IMG_1176.MOV),
// a plain dot grid on the right, matching the reference layout.
// ================================================================

function openLandMinesweeperScreen() {
  landPopupOpen = true;

  memoryPopupOpen = false;
  homePopupOpen = false;
  borderPopupOpen = false;
  clothesPopupOpen = false;
  blurPopupOpen = false;
  belongingPopupOpen = false;
  safePauseHomeVideo();

  if (landVideo && landVideo.elt) {
    try {
      landVideo.elt.currentTime = 0;
      let playPromise = landVideo.elt.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function() {});
      }
    } catch (err) {
      // Ignore playback errors.
    }
  }
}

function closeLandMinesweeperScreen() {
  landPopupOpen = false;

  if (landVideo && landVideo.elt) {
    try {
      landVideo.elt.pause();
    } catch (err) {
      // Ignore pause errors.
    }
  }
}

function drawLandMinesweeperScreen() {
  background(255);

  let dividerY = height * 0.06;

  push();
  resetMatrix();

  noStroke();
  fill(0);
  rect(0, 0, width, dividerY * 0.35);

  let contentTop = dividerY;
  let contentH = height - dividerY;
  let halfW = width / 2;

  // Left half: the minesweeper video.
  if (landVideo && landVideo.elt) {
    drawingContext.save();
    drawingContext.filter = "grayscale(100%)";
    drawVideoCoverToContext(drawingContext, landVideo, 0, contentTop, halfW, contentH);
    drawingContext.filter = "none";
    drawingContext.restore();
  } else {
    fill(235);
    rect(0, contentTop, halfW, contentH);
    fill(150);
    textFont(mainFont);
    textAlign(CENTER, CENTER);
    textSize(Math.max(11, width * 0.014));
    text("content coming soon", halfW / 2, contentTop + contentH / 2);
  }

  // Right half: a plain grid of dots.
  fill(0);
  noStroke();

  let cols = 22;
  let rowsCount = 26;
  let padX = halfW * 0.12;
  let padY = contentH * 0.08;
  let gridW = halfW - padX * 2;
  let gridH = contentH - padY * 2;

  for (let r = 0; r < rowsCount; r++) {
    for (let c = 0; c < cols; c++) {
      let gx = halfW + padX + (c / (cols - 1)) * gridW;
      let gy = contentTop + padY + (r / (rowsCount - 1)) * gridH;
      circle(gx, gy, 2.4);
    }
  }

  pop();

  drawLandExitButton();
}

function drawLandExitButton() {
  push();
  resetMatrix();
  noStroke();
  fill(0, 200);
  textFont(mainFont);
  textSize(16);
  textAlign(CENTER, CENTER);
  drawingContext.direction = "ltr";
  text("×", width - 24, 24);
  pop();
}

function isInsideLandExitButton(mx, my) {
  if (!landPopupOpen) return false;

  return dist(mx, my, width - 24, 24) < 14;
}

function initMemorySystem() {
  // The character canvases below draw with mainFont; if it's still mid-load
  // (loadFont resolves asynchronously) this can fail. Since draw() calls
  // initMemorySystem() again every frame while memorySystemReady stays
  // false, simply returning here retries automatically once the font's
  // load attempt has resolved — no crash, just a one-frame-or-so wait.
  if (!mainFontReady) {
    return;
  }

  configureMemoryGrid();

  memoryPointerPos = new MemoryVec2();

  createMemorySystem();
  bindMemoryPointerEvents();

  memoryLastTime = millis();
  memorySystemReady = true;
}

function configureMemoryGrid() {
  let layout = getMemoryCurtainLayout();
  let rowSpacing = 1.28;

  // aheight is the unstretched physics height. Multiplying it by rowSpacing
  // produces the final hanging height visible in the approved design.
  let w = layout.clothW;
  let h = layout.clothH / rowSpacing;

  memoryConfig = {
    awidth: w,
    aheight: h,

    gridW: MEMORY_GRID_COLUMNS,
    gridH: MEMORY_TARGET_GRID_ROWS,

    rowSpacing: rowSpacing,

    gravity: 0.2,
    damping: 0.99,

    iterationsPerFrame: 5,

    compressFactor: 0.02,
    stretchFactor: 1.1,

    // Touch interaction behaves like a broad wind field, not a hard push.
    // Slightly stronger and more immediate touch response for the memory cloth.
    touchBreezeRadius: 150,
    touchBreezeForce: 0.00215,
    touchBreezeAttack: 0.22,
    touchBreezeRelease: 0.058,
    touchBreezeDirectionSmoothing: 0.18,
    touchBreezeIdleStrength: 0.28,
    touchBreezeSpeedForMax: 0.72,

    // Retained only for compatibility with older state cleanup code.
    grabRadius: 0,

    contain: false,
    randomSolve: false,

    micThreshold: 0.012,
    micMaxLevel: 0.12,

    blowSmoothing: 0.34,
    blowRelease: 0.075,

    // Slightly stronger microphone response as well, while remaining controlled.
    blowForceMax: 0.00168,
    blowVerticalWave: 0.00060,

    blowDirectionX: 1
  };

  memoryConfig.cellWidth = memoryConfig.awidth / (memoryConfig.gridW - 1);
  memoryConfig.baseCellHeight = memoryConfig.aheight / (memoryConfig.gridH - 1);
  memoryConfig.cellHeight = memoryConfig.baseCellHeight * memoryConfig.rowSpacing;
  memoryConfig.contentHeight = memoryConfig.cellHeight * (memoryConfig.gridH - 1);

  let memoryParagraphs = MEMORY_SOURCE_TEXT
    .trim()
    .split(/\n\s*\n/)
    .map(function (p) {
      return p.replace(/\s+/g, " ").trim();
    })
    .filter(Boolean);

  let hebrewMemoryText = memoryParagraphs[0] || "";
  let arabicMemoryText = memoryParagraphs[1] || "";

  memoryHebrewRows = buildMemoryRTLTextRows(
    hebrewMemoryText,
    memoryConfig.gridW,
    memoryConfig.gridH
  );

  memoryArabicRows = buildMemoryRTLTextRows(
    arabicMemoryText,
    memoryConfig.gridW,
    memoryConfig.gridH
  );

  memoryTextRows = memoryHebrewRows;
}

function splitMemoryGraphemes(text) {
  if (window.Intl && Intl.Segmenter) {
    let segmenter = new Intl.Segmenter("ar", {
      granularity: "grapheme"
    });

    return Array.from(segmenter.segment(text), function (part) {
      return part.segment;
    });
  }

  return Array.from(text);
}

function buildMemoryRTLTextRows(text, cols, targetRows) {
  // Read the three-column curtain as normal RTL text:
  // row 1: right column -> middle column -> left column
  // row 2: right column -> middle column -> left column
  // The previous version filled one entire column from top to bottom before
  // moving left, which made the paragraph read as three separate columns.
  let words = text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  let columnCount = MEMORY_TEXT_COLUMN_COUNT;
  let columnWidth = MEMORY_TEXT_COLUMN_WIDTH_CELLS;
  let columnGap = MEMORY_TEXT_COLUMN_GAP_CELLS;
  let requiredRows = Math.max(1, Math.ceil(words.length / columnCount));

  let baseRows = Array.from(
    { length: requiredRows },
    function() { return []; }
  );

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    // The row array is reversed when it is attached to the physical curtain,
    // so logical column 0 appears visually on the RIGHT side.
    let rowIndex = Math.floor(wordIndex / columnCount);
    let logicalColumnIndex = wordIndex % columnCount;
    let logicalColumnStart =
      logicalColumnIndex * (columnWidth + columnGap);

    let glyphs = splitMemoryGraphemes(words[wordIndex]);

    // Keep a single long word inside its own visual column.
    if (glyphs.length > columnWidth) {
      glyphs = glyphs.slice(0, columnWidth);
    }

    let centeredOffset = Math.floor((columnWidth - glyphs.length) / 2);
    let logicalStart = logicalColumnStart + centeredOffset;

    for (let glyphIndex = 0; glyphIndex < glyphs.length; glyphIndex++) {
      baseRows[rowIndex][logicalStart + glyphIndex] = glyphs[glyphIndex];
    }
  }

  // Fill undefined cells with spaces so every physical row keeps a stable
  // width and the Hebrew/Arabic layers remain perfectly registered.
  baseRows = baseRows.map(function(row) {
    let completeRow = Array.from({ length: cols }, function() { return " "; });

    for (let i = 0; i < Math.min(cols, row.length); i++) {
      if (row[i] !== undefined) completeRow[i] = row[i];
    }

    return completeRow;
  });

  return stretchMemoryRowsToTarget(baseRows, targetRows);
}

function stretchMemoryRowsToTarget(rows, targetRows) {
  if (rows.length === 0) {
    return Array.from({ length: targetRows }, function () {
      return [];
    });
  }

  if (rows.length >= targetRows) {
    return rows.slice(0, targetRows);
  }

  let extraRows = targetRows - rows.length;

  let finalRows = [];
  let inserted = 0;

  let safeGapCount = Math.max(1, rows.length - 1);
  let insertEvery = Math.max(1, Math.floor(safeGapCount / Math.max(1, extraRows)));

  for (let i = 0; i < rows.length; i++) {
    finalRows.push(rows[i]);

    if (
      i < rows.length - 1 &&
      inserted < extraRows &&
      i % insertEvery === 0
    ) {
      finalRows.push([]);
      inserted++;
    }
  }

  while (finalRows.length < targetRows) {
    finalRows.push([]);
  }

  return finalRows.slice(0, targetRows);
}

function createMemorySystem() {
  memoryParticles = [];
  memoryConstraints = [];
  memoryHorizontalConstraints = [];
  memoryPinnedParticles = [];

  createMemoryCharCanvases();

  let gridW = memoryConfig.gridW;
  let gridH = memoryConfig.gridH;
  let cellWidth = memoryConfig.cellWidth;
  let cellHeight = memoryConfig.cellHeight;
  let compressFactor = memoryConfig.compressFactor;
  let stretchFactor = memoryConfig.stretchFactor;

  for (let i = 0; i < gridW; i++) {
    for (let j = 0; j < gridH; j++) {
      let x = i * cellWidth;
      let y = j * cellHeight;

      let id = getMemoryPointID(j, i, gridH);
      let pinned = j === 0;

      let hebrewRow = memoryHebrewRows[j] || [];
      let arabicRow = memoryArabicRows[j] || [];

      let rtlIndex = gridW - 1 - i;
      let char = hebrewRow[rtlIndex] || " ";
      let arabicChar = arabicRow[rtlIndex] || " ";

      let particle = new MemoryParticle({
        x,
        y,
        pinned,
        id,
        char,
        arabicChar,
        renderKey: j + "_" + rtlIndex
      });

      memoryParticles.push(particle);

      if (pinned) {
        memoryPinnedParticles.push(particle);
      }
    }
  }

  for (let i = 0; i < gridW; i++) {
    for (let j = 0; j < gridH; j++) {
      let id = getMemoryPointID(j, i, gridH);
      let p = memoryParticles[id];

      if (j < gridH - 1) {
        let bottomP = memoryParticles[getMemoryPointID(j + 1, i, gridH)];

        let verticalConstraint = new MemoryConstraint({
          p1: p,
          p2: bottomP,
          length: cellHeight,
          id: id + gridW * gridH,
          compressFactor,
          stretchFactor,
          isSpacer: false
        });

        memoryConstraints.push(verticalConstraint);
        p.downConstraint = verticalConstraint;
      }

      if (i < gridW - 1) {
        let rightP = memoryParticles[getMemoryPointID(j, i + 1, gridH)];

        let horizontalConstraint = new MemoryConstraint({
          p1: p,
          p2: rightP,
          length: cellWidth,
          id: id + gridW * gridH * 2,
          compressFactor: 0.6,
          stretchFactor: 4,
          isSpacer: true
        });

        memoryConstraints.push(horizontalConstraint);
        memoryHorizontalConstraints.push(horizontalConstraint);
      }
    }
  }
}

function createMemoryCharCanvases() {
  memoryCharCanvases = {};
  memoryCellCanvases = {};

  let hebrewFontSize = Math.max(7, memoryConfig.baseCellHeight * 1.3);
  let arabicFontSize = hebrewFontSize * MEMORY_ARABIC_FONT_SCALE;
  let uniqueHebrewChars = new Set();

  // Hebrew is rendered as cyan single-character cells.
  for (let row of memoryHebrewRows) {
    for (let ch of row) {
      if (ch !== " ") {
        uniqueHebrewChars.add(ch);
      }
    }
  }

  for (let ch of uniqueHebrewChars) {
    let size = Math.ceil(hebrewFontSize * 1.8);
    let g = createGraphics(size, size);

    g.pixelDensity(getSharpRenderDensity());
    g.clear();
    g.textFont(mainFont);
    g.textSize(hebrewFontSize);
    g.textAlign(CENTER, CENTER);
    g.noStroke();
    g.fill(MEMORY_HEBREW_COLOR);

    g.drawingContext.direction = "rtl";
    g.drawingContext.textRendering = "geometricPrecision";

    g.text(ch, size / 2, size / 2 + hebrewFontSize * 0.04);

    memoryCharCanvases[ch] = g;
  }

  // Arabic is rendered as complete connected red words, then sliced into
  // columns. The slices use the same row/column keys as the Hebrew layer,
  // so both languages remain precisely overlaid while the curtain moves.
  for (let rowIndex = 0; rowIndex < memoryArabicRows.length; rowIndex++) {
    let row = memoryArabicRows[rowIndex] || [];
    let start = 0;

    while (start < row.length) {
      while (start < row.length && row[start] === " ") start++;
      if (start >= row.length) break;

      let end = start;
      while (end < row.length && row[end] !== " ") end++;

      let word = row.slice(start, end).join("");

      if (isMemoryArabicText(word)) {
        createMemoryArabicWordSlices(
          word,
          rowIndex,
          start,
          end - start,
          arabicFontSize
        );
      }

      start = end;
    }
  }
}

function isMemoryArabicText(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function expandMemoryArabicWordWithKashida(word, targetWidth, ctx) {
  let result = word;
  let attempts = 0;

  // Reuse the same joining rules used elsewhere in the project. Stop before
  // the word becomes wider than its allocated grid columns.
  while (ctx.measureText(forceRTL(result)).width < targetWidth && attempts < 80) {
    if (!canWordTakeKashida(result)) break;

    let candidate = addOneKashida(result);
    if (candidate === result) break;

    let candidateWidth = ctx.measureText(forceRTL(candidate)).width;
    if (candidateWidth > targetWidth + memoryConfig.cellWidth * 0.35) break;

    result = candidate;
    attempts++;
  }

  return result;
}

function createMemoryArabicWordSlices(word, rowIndex, logicalStart, cellCount, fontSize) {
  if (cellCount <= 0) return;

  let cellW = memoryConfig.cellWidth;
  let overlap = Math.max(1, cellW * 0.02);
  let sidePadding = overlap + 3;
  let contentW = cellCount * cellW;
  let fullW = Math.ceil(contentW + sidePadding * 2);
  let fullH = Math.ceil(fontSize * 2.05);

  let fullWord = createGraphics(fullW, fullH);
  fullWord.pixelDensity(getSharpRenderDensity());
  fullWord.clear();
  fullWord.textFont(mainFont);
  fullWord.textSize(fontSize);
  fullWord.textAlign(CENTER, CENTER);
  fullWord.noStroke();
  fullWord.fill(MEMORY_ARABIC_COLOR);

  let ctx = fullWord.drawingContext;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.textRendering = "geometricPrecision";
  ctx.font = fontSize + "px 'SimplerPro_HLAR_Mono', monospace";

  let stretchedWord = expandMemoryArabicWordWithKashida(
    word,
    contentW * 0.80,
    ctx
  );

  ctx.fillStyle = MEMORY_ARABIC_COLOR;
  ctx.fillText(forceRTL(stretchedWord), fullW / 2, fullH / 2 + fontSize * 0.04);

  let sliceW = Math.ceil(cellW + overlap * 2);

  for (let logicalIndex = 0; logicalIndex < cellCount; logicalIndex++) {
    // row[0] is placed at the right side of the RTL grid, therefore the
    // logical character index maps to the reversed visual slice index.
    let visualIndex = cellCount - 1 - logicalIndex;
    let sourceCenterX = sidePadding + visualIndex * cellW + cellW / 2;
    let sourceX = Math.floor(sourceCenterX - sliceW / 2);

    let slice = createGraphics(sliceW, fullH);
    slice.pixelDensity(getSharpRenderDensity());
    slice.clear();
    slice.image(fullWord, -sourceX, 0);

    let key = rowIndex + "_" + (logicalStart + logicalIndex);
    memoryCellCanvases[key] = slice;
  }
}

function updateMemoryPhysics(delta) {
  applyMemoryBlowForce(delta);
  updateMemoryTouchBreeze(delta);

  for (let p of memoryParticles) {
    p.update(delta);
  }

  if (memoryConfig.randomSolve) {
    memoryShuffleArray(memoryConstraints);
  }

  for (let i = 0; i < memoryConfig.iterationsPerFrame; i++) {
    for (let j = 0; j < memoryConstraints.length; j++) {
      memoryConstraints[j].solve();
    }
  }

  if (memoryConfig.contain) {
    for (let p of memoryParticles) {
      p.contain();
    }
  }
}

function getMemoryMicrophoneLevel() {
  if (!memoryMicStarted || !memoryMic || !memoryMicData) {
    return 0;
  }

  memoryMic.getByteTimeDomainData(memoryMicData);

  let sumSquares = 0;

  for (let i = 0; i < memoryMicData.length; i++) {
    let centered = (memoryMicData[i] - 128) / 128;
    sumSquares += centered * centered;
  }

  // RMS amplitude, normally in the approximate 0..0.2 range for speech/blowing.
  return Math.sqrt(sumSquares / memoryMicData.length);
}

function applyMemoryBlowForce(delta) {
  memoryRawMicLevel = getMemoryMicrophoneLevel();

  let normalized = map(
    memoryRawMicLevel,
    memoryConfig.micThreshold,
    memoryConfig.micMaxLevel,
    0,
    1,
    true
  );

  normalized = constrain(normalized, 0, 1);

  // Keep quiet room noise near zero, but make an actual breath react quickly.
  let targetBlow = Math.pow(normalized, 1.25);

  if (targetBlow > memoryBlowAmount) {
    memoryBlowAmount = lerp(memoryBlowAmount, targetBlow, memoryConfig.blowSmoothing);
  } else {
    memoryBlowAmount = lerp(memoryBlowAmount, targetBlow, memoryConfig.blowRelease);
  }

  memoryBlowDisplay = lerp(memoryBlowDisplay, memoryBlowAmount, 0.2);

  if (memoryBlowAmount < 0.002) return;

  let time = millis() * 0.001;

  for (let p of memoryParticles) {
    if (p.pinned) continue;

    let rowFactor = constrain(p.pos.y / memoryConfig.contentHeight, 0, 1);

    // The lower rows move more, producing the hanging-curtain behavior.
    let softAmount = memoryBlowAmount * (0.22 + rowFactor * 0.98);
    let columnWave = Math.sin(time * 3.1 + p.id * 0.19);

    let windX =
      memoryConfig.blowForceMax *
      softAmount *
      memoryConfig.blowDirectionX;

    let windY =
      columnWave *
      memoryConfig.blowVerticalWave *
      softAmount;

    p.applyForce(new MemoryVec2(windX, windY));
  }
}

// Shared center offset for the memory cloth simulation: centers it within
// the grid region (left of the sidebar divider, below the header) instead
// of the full window, so the header/divider/sidebar stay visible around it.
function loadMemoryCurtainHolderSvg() {
  if (typeof window === "undefined") return;

  memoryCurtainHolderSvg = new Image();
  memoryCurtainHolderSvg.onload = function() {
    memoryCurtainHolderReady = true;

    if (memorySystemReady) {
      configureMemoryGrid();
      createMemorySystem();
    }
  };
  memoryCurtainHolderSvg.onerror = function() {
    memoryCurtainHolderReady = false;
    console.log("MISSING FILE: curtain_holder.svg (put it beside sketch.js)");
  };
  memoryCurtainHolderSvg.src = "curtain_holder.svg";
}

function getMemoryCurtainLayout() {
  let region = getMemoryRegionBounds();
  let holderW = min(region.w * 0.355, 610);
  let naturalRatio = 0.18;

  if (
    memoryCurtainHolderReady &&
    memoryCurtainHolderSvg &&
    memoryCurtainHolderSvg.naturalWidth > 0
  ) {
    naturalRatio = memoryCurtainHolderSvg.naturalHeight / memoryCurtainHolderSvg.naturalWidth;
  }

  let holderH = holderW * naturalRatio;
  let holderX = region.x + region.w / 2 - holderW / 2;
  let holderY = region.y + region.h * 0.115;

  // The rod is near the top of the supplied SVG. The curtain particles begin
  // just below it so the first row appears physically attached to the holder.
  let rodY = holderY + holderH * 0.10;
  // A wider cloth plus fewer grid cells gives every word its natural horizontal
  // breathing room while preserving the exact holder size and screen position.
  let clothW = holderW * 0.79;
  let clothH = min(region.h * 0.67, 555);
  let clothX = region.x + region.w / 2 - clothW / 2;
  let clothY = rodY + 13;

  return {
    region: region,
    holderX: holderX,
    holderY: holderY,
    holderW: holderW,
    holderH: holderH,
    clothX: clothX,
    clothY: clothY,
    clothW: clothW,
    clothH: clothH
  };
}

function getMemoryContentOffset() {
  let layout = getMemoryCurtainLayout();

  return {
    x: layout.clothX,
    y: layout.clothY
  };
}

function drawMemoryCurtainHolder() {
  if (!memoryCurtainHolderReady || !memoryCurtainHolderSvg) return;

  let layout = getMemoryCurtainLayout();

  push();
  resetMatrix();
  drawingContext.save();
  drawingContext.globalCompositeOperation = "source-over";
  drawingContext.globalAlpha = 1;
  drawingContext.imageSmoothingEnabled = true;
  drawingContext.drawImage(
    memoryCurtainHolderSvg,
    layout.holderX,
    layout.holderY,
    layout.holderW,
    layout.holderH
  );
  drawingContext.restore();
  pop();
}

function drawMemoryTopBar(alphaVal) {
  // Keep the memory screen header identical to the main navigation bar.
  // The bilingual "found" label stays on the left, and memory remains in
  // its normal navigation position alongside every other found word.
  drawTopBar(alphaVal);
}

// Decorative frame lines removed. Only the memory letters are drawn.

function drawMemoryCode() {
  let offset = getMemoryContentOffset();
  let localOffsetX = offset.x;
  let localOffsetY = offset.y;

  drawingContext.imageSmoothingEnabled = true;
  drawingContext.save();
  drawingContext.globalCompositeOperation = "multiply";
  drawingContext.globalAlpha = 0.58;

  for (let p of memoryParticles) {
    let hebrewImg =
      p.char && p.char !== " "
        ? memoryCharCanvases[p.char]
        : null;

    let arabicImg =
      p.arabicChar && p.arabicChar !== " "
        ? memoryCellCanvases[p.renderKey]
        : null;

    if (!hebrewImg && !arabicImg) continue;

    let angle = 0;
    let constraint = p.downConstraint;

    if (constraint) {
      let dx = constraint.p2.pos.x - constraint.p1.pos.x;
      let dy = constraint.p2.pos.y - constraint.p1.pos.y;
      angle = Math.atan2(dy, dx) - Math.PI / 2;
    }

    push();
    translate(
      p.pos.x + localOffsetX + memoryConfig.cellWidth / 2,
      p.pos.y + localOffsetY
    );
    rotate(angle);

    // A small registration offset keeps both languages visible while multiply
    // preserves the visual identity of the rest of the project.
    if (hebrewImg) {
      image(hebrewImg, -hebrewImg.width / 2 + 1.25, 0.7);
    }

    if (arabicImg) {
      image(arabicImg, -arabicImg.width / 2 - 1.25, -0.7);
    }

    pop();
  }

  drawingContext.restore();
}

function drawMemoryMicStatus() {
  // Intentionally hidden in the approved interface.
}

async function startMemoryAudioInput() {
  if (memoryMicStarted || memoryMicPending) return;

  memoryMicPending = true;
  memoryMicError = false;

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("This browser does not support microphone access.");
    }

    // Reuse the same stream if the memory screen is opened again.
    if (!memoryMicStream) {
      memoryMicStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });
    }

    let AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("This browser does not support Web Audio.");
    }

    if (!memoryAudioContext) {
      memoryAudioContext = new AudioContextClass();
    }

    if (memoryAudioContext.state === "suspended") {
      await memoryAudioContext.resume();
    }

    if (!memoryMicSource) {
      memoryMicSource = memoryAudioContext.createMediaStreamSource(memoryMicStream);
    }

    if (!memoryMic) {
      memoryMic = memoryAudioContext.createAnalyser();
      memoryMic.fftSize = 1024;
      memoryMic.smoothingTimeConstant = 0.15;
      memoryMicSource.connect(memoryMic);
      memoryMicData = new Uint8Array(memoryMic.fftSize);
    }

    memoryMicStarted = true;
    memoryMicPending = false;
    memoryMicError = false;
  } catch (err) {
    console.error("Microphone could not start:", err);
    memoryMicStarted = false;
    memoryMicPending = false;
    memoryMicError = true;
  }
}

function bindMemoryPointerEvents() {
  if (memoryPointerEventsBound) return;

  let el = document.querySelector("canvas");
  if (!el) return;

  memoryCanvasElement = el;

  memoryCanvasElement.addEventListener("pointerdown", memoryPointerDownHandler, {
    passive: false
  });

  memoryCanvasElement.addEventListener("pointermove", memoryPointerMoveHandler, {
    passive: false
  });

  window.addEventListener("pointerup", memoryPointerUpHandler, {
    passive: false
  });

  window.addEventListener("pointercancel", memoryPointerUpHandler, {
    passive: false
  });

  memoryPointerEventsBound = true;
}

function updateMemoryPointerPosition(e) {
  let rect = memoryCanvasElement.getBoundingClientRect();

  let scaleX = width / rect.width;
  let scaleY = height / rect.height;

  let canvasX = (e.clientX - rect.left) * scaleX;
  let canvasY = (e.clientY - rect.top) * scaleY;

  let offset = getMemoryContentOffset();

  memoryPointerPos.x = canvasX - offset.x;
  memoryPointerPos.y = canvasY - offset.y;
}

function isMemoryPointerInRegion(e) {
  let rect = memoryCanvasElement.getBoundingClientRect();
  let scaleX = width / rect.width;
  let scaleY = height / rect.height;
  let canvasX = (e.clientX - rect.left) * scaleX;
  let canvasY = (e.clientY - rect.top) * scaleY;
  let region = getMemoryRegionBounds();

  return canvasX >= region.x && canvasX <= region.x + region.w &&
    canvasY >= region.y && canvasY <= region.y + region.h;
}

function memoryPointerDownHandler(e) {
  if (!memoryPopupOpen) return;
  if (!isMemoryPointerInRegion(e)) return;

  e.preventDefault();

  startMemoryAudioInput();
  updateMemoryPointerPosition(e);

  // Start a gentle breeze instead of pinning or dragging one letter.
  memoryPointerIsDown = true;
  memoryGrabbedParticle = null;

  memoryPointerPreviousPos = {
    x: memoryPointerPos.x,
    y: memoryPointerPos.y
  };
  memoryPointerPreviousTime = performance.now();
  memoryBreezeLastMoveAt = memoryPointerPreviousTime;

  // A stationary press starts with a small sideways draft. Movement then
  // takes over and determines the wind direction naturally.
  let initialX = memoryPointerPos.x < memoryConfig.awidth * 0.5 ? 1 : -1;
  memoryBreezeTargetDirection.x = initialX;
  memoryBreezeTargetDirection.y = -0.08;
  memoryBreezeTargetStrength = memoryConfig.touchBreezeIdleStrength;
}

function memoryPointerMoveHandler(e) {
  if (!memoryPopupOpen) return;
  if (!memoryPointerIsDown) return;
  if (!isMemoryPointerInRegion(e)) return;

  e.preventDefault();

  updateMemoryPointerPosition(e);
  updateMemoryBreezeFromPointerMotion();
}

function updateMemoryBreezeFromPointerMotion() {
  if (!memoryPointerPos) return;

  let now = performance.now();

  if (!memoryPointerPreviousPos) {
    memoryPointerPreviousPos = {
      x: memoryPointerPos.x,
      y: memoryPointerPos.y
    };
    memoryPointerPreviousTime = now;
    return;
  }

  let dx = memoryPointerPos.x - memoryPointerPreviousPos.x;
  let dy = memoryPointerPos.y - memoryPointerPreviousPos.y;
  let distance = Math.hypot(dx, dy);
  let elapsed = Math.max(8, now - memoryPointerPreviousTime);

  if (distance > 0.2) {
    memoryBreezeTargetDirection.x = dx / distance;
    memoryBreezeTargetDirection.y = dy / distance;

    let speed = distance / elapsed;
    memoryBreezeTargetStrength = constrain(
      map(
        speed,
        0,
        memoryConfig.touchBreezeSpeedForMax,
        memoryConfig.touchBreezeIdleStrength,
        1
      ),
      memoryConfig.touchBreezeIdleStrength,
      1
    );

    memoryBreezeLastMoveAt = now;
  }

  memoryPointerPreviousPos.x = memoryPointerPos.x;
  memoryPointerPreviousPos.y = memoryPointerPos.y;
  memoryPointerPreviousTime = now;
}

function updateMemoryTouchBreeze(delta) {
  if (!memoryConfig || !memoryPointerPos) return;

  let now = performance.now();

  if (memoryPointerIsDown) {
    // When the finger pauses, the wind settles into a quiet draft rather than
    // stopping abruptly. Moving again immediately raises the force.
    if (now - memoryBreezeLastMoveAt > 90) {
      memoryBreezeTargetStrength = memoryConfig.touchBreezeIdleStrength;
    }
  } else {
    // Keep a short trailing breeze after release.
    memoryBreezeTargetStrength = 0;
  }

  let frameScale = constrain(delta / 16.667, 0.35, 2.5);
  let strengthBase =
    memoryBreezeTargetStrength > memoryBreezeStrength
      ? memoryConfig.touchBreezeAttack
      : memoryConfig.touchBreezeRelease;
  let strengthMix = 1 - Math.pow(1 - strengthBase, frameScale);
  let directionMix = 1 - Math.pow(
    1 - memoryConfig.touchBreezeDirectionSmoothing,
    frameScale
  );

  memoryBreezeStrength = lerp(
    memoryBreezeStrength,
    memoryBreezeTargetStrength,
    strengthMix
  );

  memoryBreezeDirection.x = lerp(
    memoryBreezeDirection.x,
    memoryBreezeTargetDirection.x,
    directionMix
  );
  memoryBreezeDirection.y = lerp(
    memoryBreezeDirection.y,
    memoryBreezeTargetDirection.y,
    directionMix
  );

  let directionLength = Math.hypot(
    memoryBreezeDirection.x,
    memoryBreezeDirection.y
  );

  if (directionLength > 0.0001) {
    memoryBreezeDirection.x /= directionLength;
    memoryBreezeDirection.y /= directionLength;
  }

  if (memoryBreezeStrength < 0.001) return;

  applyMemoryPointerForce();
}

function applyMemoryPointerForce() {
  if (!memoryPointerPos || memoryBreezeStrength <= 0) return;

  let radius = memoryConfig.touchBreezeRadius;
  let radiusSquared = radius * radius;
  let time = millis() * 0.0032;

  for (let p of memoryParticles) {
    if (p.pinned) continue;

    let dx = p.pos.x - memoryPointerPos.x;
    let dy = p.pos.y - memoryPointerPos.y;
    let distanceSquared = dx * dx + dy * dy;

    if (distanceSquared >= radiusSquared) continue;

    let distance = Math.sqrt(distanceSquared);
    let normalizedDistance = distance / radius;

    // Cubic smooth falloff removes the hard circular edge of the old force.
    let falloff = 1 - normalizedDistance;
    falloff = falloff * falloff * (3 - 2 * falloff);

    let outwardX = distance > 0.001 ? dx / distance : 0;
    let outwardY = distance > 0.001 ? dy / distance : 0;

    // Finger direction controls most of the breeze. A small radial component
    // makes nearby letters part naturally without looking mechanically pushed.
    let windX = memoryBreezeDirection.x * 0.84 + outwardX * 0.16;
    let windY = memoryBreezeDirection.y * 0.78 + outwardY * 0.12;

    // A slight wave prevents every row from moving as one rigid sheet.
    windY += Math.sin(time + p.id * 0.17) * 0.10;

    let lowerClothFactor = 0.30 +
      constrain(p.pos.y / memoryConfig.contentHeight, 0, 1) * 0.70;

    let forceAmount =
      memoryConfig.touchBreezeForce *
      memoryBreezeStrength *
      falloff *
      lowerClothFactor;

    p.applyForce(new MemoryVec2(
      windX * forceAmount,
      windY * forceAmount
    ));
  }
}

function memoryPointerUpHandler(e) {
  if (!memoryPopupOpen) return;

  if (e) e.preventDefault();

  // Do not stop the force instantly. updateMemoryTouchBreeze() eases it down,
  // leaving a brief natural after-motion in the hanging words.
  memoryPointerIsDown = false;
  memoryGrabbedParticle = null;
  memoryPointerPreviousPos = null;
  memoryPointerPreviousTime = 0;
  memoryBreezeTargetStrength = 0;
}

function drawMemoryCloseButton() {
  // The approved design has no visible close icon.
}

function getMemoryPointID(row, col, gridH) {
  return col * gridH + row;
}

function memorySmoothstep(edge0, edge1, x) {
  let t = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function memoryShuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

class MemoryVec2 {
  constructor(x = 0, y = 0) {
    this.reset(x, y);
  }

  zero() {
    this.reset(0, 0);
  }

  reset(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new MemoryVec2(this.x, this.y);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  addNew(v) {
    return this.clone().add(v);
  }

  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  subtractNew(v) {
    return this.clone().subtract(v);
  }

  multiply(v) {
    this.x *= v.x;
    this.y *= v.y;
    return this;
  }

  multiplyNew(v) {
    return this.clone().multiply(v);
  }

  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  scaleNew(scalar) {
    return this.clone().scale(scalar);
  }

  get array() {
    return [this.x, this.y];
  }

  get lengthSquared() {
    return this.x * this.x + this.y * this.y;
  }

  get length() {
    return Math.hypot(this.x, this.y);
  }

  get angle() {
    return Math.atan2(this.y, this.x);
  }
}

class MemoryParticle {
  constructor({ x, y, pinned, id, char, arabicChar, renderKey } = {}) {
    this.pos = new MemoryVec2(x, y);
    this.oldPos = new MemoryVec2(x, y);

    this.velocity = new MemoryVec2();
    this.acceleration = new MemoryVec2();

    this.pinned = pinned;
    this.id = id;
    this.char = char;
    this.arabicChar = arabicChar || " ";
    this.renderKey = renderKey || "";

    this.gravityVec = new MemoryVec2();

    this.downConstraint = null;
    this.originalPinnedState = pinned;
  }

  contain() {
    if (this.pinned) return;

    let radius = 5;

    if (this.pos.x < radius) {
      this.pos.x = radius;
      this.oldPos.x = this.pos.x + Math.abs(this.oldPos.x - this.pos.x) * 0.8;
    } else if (this.pos.x > memoryConfig.awidth - radius) {
      this.pos.x = memoryConfig.awidth - radius;
      this.oldPos.x = this.pos.x - Math.abs(this.oldPos.x - this.pos.x) * 0.8;
    }

    if (this.pos.y < radius) {
      this.pos.y = radius;
      this.oldPos.y = this.pos.y + Math.abs(this.oldPos.y - this.pos.y) * 0.8;
    } else if (this.pos.y > memoryConfig.contentHeight - radius) {
      this.pos.y = memoryConfig.contentHeight - radius;
      this.oldPos.y = this.pos.y - Math.abs(this.oldPos.y - this.pos.y) * 0.8;
    }
  }

  update(delta) {
    if (this.pinned) {
      this.acceleration.zero();
      return;
    }

    this.velocity.reset(
      (this.pos.x - this.oldPos.x) * memoryConfig.damping,
      (this.pos.y - this.oldPos.y) * memoryConfig.damping
    );

    this.oldPos.reset(this.pos.x, this.pos.y);

    let dd = delta * delta;

    this.gravityVec.reset(0, memoryConfig.gravity / dd);
    this.applyForce(this.gravityVec);

    this.pos.x += this.velocity.x + this.acceleration.x * dd;
    this.pos.y += this.velocity.y + this.acceleration.y * dd;

    this.acceleration.reset();
  }

  applyForce(v) {
    this.acceleration.add(v);
  }
}

class MemoryConstraint {
  constructor({
    p1,
    p2,
    length,
    id,
    compressFactor,
    stretchFactor,
    isSpacer = false
  }) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = length;
    this.id = id;

    this.compressFactor = compressFactor;
    this.stretchFactor = stretchFactor;
    this.isSpacer = isSpacer;

    this.minLength = length * compressFactor;
    this.maxLength = length * stretchFactor;
  }

  solve() {
    let dx = this.p2.pos.x - this.p1.pos.x;
    let dy = this.p2.pos.y - this.p1.pos.y;

    let distance = Math.hypot(dx, dy);

    if (distance === 0) return;

    let targetLength = this.length;

    if (distance < this.minLength) {
      targetLength = this.minLength;
    } else if (distance > this.maxLength) {
      targetLength = this.maxLength;
    } else {
      return;
    }

    let difference = targetLength - distance;
    let percent = difference / distance / 2;

    let offsetX = dx * percent;
    let offsetY = dy * percent;

    if (!this.p1.pinned) {
      this.p1.pos.x -= offsetX;
      this.p1.pos.y -= offsetY;
    }

    if (!this.p2.pinned) {
      this.p2.pos.x += offsetX;
      this.p2.pos.y += offsetY;
    }
  }
}

class SelectionCell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
  }
}

class FoundWord {
  constructor(cells, word, wordColor, createdAt) {
    this.cells = cells;
    this.word = word;
    this.wordColor = wordColor;
    this.createdAt = createdAt !== undefined ? createdAt : millis();
  }
}




// iPad touch support.
// This does not change the existing mouse logic.
// It only converts iPad touch events into the same mousePressed / mouseDragged / mouseReleased flow.
function setupIpadTouchSupport() {
  setTimeout(function() {
    let canvasEl = document.querySelector("canvas");
    if (!canvasEl) return;

    canvasEl.style.touchAction = "none";
    canvasEl.style.webkitUserSelect = "none";
    canvasEl.style.userSelect = "none";
    canvasEl.style.webkitTapHighlightColor = "rgba(0,0,0,0)";

    document.documentElement.style.touchAction = "none";
    document.body.style.touchAction = "none";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.body.style.webkitUserSelect = "none";
    document.body.style.userSelect = "none";

    canvasEl.addEventListener("touchstart", ipadTouchStarted, { passive: false });
    canvasEl.addEventListener("touchmove", ipadTouchMoved, { passive: false });
    canvasEl.addEventListener("touchend", ipadTouchEnded, { passive: false });
    canvasEl.addEventListener("touchcancel", ipadTouchEnded, { passive: false });

    document.addEventListener("gesturestart", function(e) {
      e.preventDefault();
    }, { passive: false });

    document.addEventListener("gesturechange", function(e) {
      e.preventDefault();
    }, { passive: false });

    document.addEventListener("gestureend", function(e) {
      e.preventDefault();
    }, { passive: false });
  }, 80);
}

function ipadTouchPointFromEvent(e) {
  let touch = null;

  if (e.touches && e.touches.length > 0) {
    touch = e.touches[0];
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    touch = e.changedTouches[0];
  }

  if (!touch) return null;

  let canvasEl = document.querySelector("canvas");
  if (!canvasEl) return null;

  let rect = canvasEl.getBoundingClientRect();

  return {
    x: (touch.clientX - rect.left) * (width / rect.width),
    y: (touch.clientY - rect.top) * (height / rect.height)
  };
}

function ipadSetMousePosition(x, y) {
  pmouseX = mouseX;
  pmouseY = mouseY;
  mouseX = x;
  mouseY = y;
}

function ipadTouchStarted(e) {
  e.preventDefault();

  let p = ipadTouchPointFromEvent(e);
  if (!p) return false;

  ipadSetMousePosition(p.x, p.y);

  if (typeof mousePressed === "function") {
    mousePressed();
  }

  return false;
}

function ipadTouchMoved(e) {
  e.preventDefault();

  let p = ipadTouchPointFromEvent(e);
  if (!p) return false;

  ipadSetMousePosition(p.x, p.y);

  if (typeof mouseDragged === "function") {
    mouseDragged();
  }

  return false;
}

function ipadTouchEnded(e) {
  e.preventDefault();

  let p = ipadTouchPointFromEvent(e);

  if (p) {
    ipadSetMousePosition(p.x, p.y);
  }

  if (typeof mouseReleased === "function") {
    mouseReleased();
  }

  return false;
}

const REFLECTION_TICKET_EMBEDDED_HTML = "<!DOCTYPE html>\n<html lang=\"he\" dir=\"rtl\">\n<head>\n  <base href=\"./\" />\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>My Reflection Ticket</title>\n  <script src=\"https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js\"></script>\n  <style>\n    @font-face {\n      font-family: \"SimplerMono\";\n      src: url(\"SimplerPro_HLAR_Mono-Regular 2.otf\") format(\"opentype\");\n      font-display: swap;\n    }\n\n    @font-face {\n      font-family: \"AlfaBravoMedium\";\n      src: url(\"AlfaBravo-medium.otf\") format(\"opentype\");\n      font-style: normal;\n      font-weight: 500;\n      font-display: swap;\n    }\n\n    :root {\n      --bg: #ececec;\n      --line: #b5b5b5;\n      --text: #111111;\n      --muted: #6c6c6c;\n      --red: #ff1d25;\n      --blue: #00f0ff;\n      --arabic-ui: #ff3535;\n      --hebrew-ui: #2ef5ff;\n      --topbar-h: clamp(88px, 9.65vh, 108px);\n    }\n\n    * {\n      box-sizing: border-box;\n    }\n\n    html, body {\n      margin: 0;\n      width: 100%;\n      height: 100%;\n      overflow: hidden;\n      background: var(--bg);\n      color: var(--text);\n      font-family: \"SimplerMono\", Arial, Helvetica, sans-serif;\n    }\n\n    body {\n      display: flex;\n      flex-direction: column;\n    }\n\n    #topBar {\n      height: var(--topbar-h);\n      border-bottom: 1px solid var(--line);\n      font-family: \"AlfaBravoMedium\", \"SimplerMono\", Arial, Helvetica, sans-serif;\n      font-weight: 500;\n      display: grid;\n      grid-template-columns: clamp(160px, 10.4vw, 200px) minmax(0, 1fr) clamp(270px, 17.5vw, 350px);\n      align-items: center;\n      gap: clamp(18px, 1.5vw, 30px);\n      padding: 0 clamp(26px, 2.3vw, 46px);\n      background: var(--bg);\n      direction: ltr;\n    }\n\n    #foundStatus {\n      justify-self: start;\n      display: flex;\n      align-items: center;\n      gap: 12px;\n      min-width: 0;\n      direction: ltr;\n      font-size: clamp(15px, 0.95vw, 18px);\n      line-height: 1;\n    }\n\n    #foundNumber {\n      width: 48px;\n      flex: 0 0 48px;\n      text-align: left;\n      direction: ltr;\n      font-variant-numeric: tabular-nums;\n    }\n\n    #foundNumber > span {\n      direction: ltr;\n      unicode-bidi: isolate;\n      text-align: left;\n    }\n\n    .overlapText {\n      display: grid;\n      position: relative;\n      min-width: 0;\n      isolation: isolate;\n    }\n\n    .overlapText > span {\n      grid-area: 1 / 1;\n      display: block;\n      direction: rtl;\n      unicode-bidi: plaintext;\n      mix-blend-mode: multiply;\n    }\n\n    /* The numeric counter must stay visibly red + cyan instead of becoming black. */\n    #foundNumber > span {\n      mix-blend-mode: normal;\n    }\n\n    .hebrewLayer {\n      color: var(--hebrew-ui);\n      transform: translate(1.35px, 0.85px);\n      opacity: 1;\n      z-index: 1;\n    }\n\n    .arabicLayer {\n      color: var(--arabic-ui);\n      transform: translate(-1.35px, -0.85px);\n      opacity: 1;\n      z-index: 2;\n    }\n\n    #foundOverlap {\n      min-width: 92px;\n      text-align: right;\n      font-size: inherit;\n      line-height: 1;\n    }\n\n    #wordNavigation {\n      justify-self: center;\n      width: 100%;\n      max-width: 900px;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      gap: clamp(18px, 2.25vw, 46px);\n      direction: rtl;\n      overflow: hidden;\n    }\n\n    .navWord {\n      flex: 0 0 auto;\n      min-width: 46px;\n      text-align: center;\n      font-size: 16px;\n      line-height: 1;\n      white-space: nowrap;\n    }\n\n    #projectTitle {\n      justify-self: end;\n      width: 100%;\n      text-align: right;\n      font-size: clamp(30px, 2.6vw, 44px);\n      font-weight: 500;\n      letter-spacing: -0.04em;\n      line-height: 0.9;\n      cursor: pointer;\n    }\n\n    #projectTitle .hebrewLayer,\n    #projectTitle .arabicLayer {\n      text-align: right;\n    }\n\n    #mainArea {\n      height: calc(100vh - var(--topbar-h));\n      display: grid;\n      grid-template-columns: minmax(0, 2.08fr) minmax(500px, 0.92fr);\n      background: var(--bg);\n      direction: ltr;\n    }\n\n    #canvasPane,\n    #questionsPane {\n      min-width: 0;\n      min-height: 0;\n      position: relative;\n    }\n\n    #canvasPane {\n      border-right: 1px solid var(--line);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      overflow: hidden;\n    }\n\n    #canvasArea {\n      width: 100%;\n      height: 100%;\n      position: relative;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n    }\n\n    #questionsPane {\n      overflow-y: auto;\n      overflow-x: hidden;\n      direction: rtl;\n      padding: clamp(30px, 4.2vh, 50px) clamp(30px, 3.35vw, 66px);\n      scrollbar-width: none;\n      display: flex;\n      align-items: center;\n    }\n\n    #questionsPane::-webkit-scrollbar {\n      display: none;\n    }\n\n    #questionsInner {\n      width: 100%;\n      max-width: 650px;\n      height: min(780px, calc(100% - 8px));\n      min-height: 650px;\n      margin: 0 auto;\n      display: flex;\n      flex-direction: column;\n      justify-content: space-between;\n    }\n\n    .questionBlock {\n      width: 100%;\n      margin: 0;\n      text-align: right;\n      flex: 0 0 auto;\n    }\n\n    .questionText {\n      width: 100%;\n      min-height: clamp(44px, 5.2vh, 58px);\n      margin-bottom: clamp(8px, 1.05vh, 13px);\n      font-size: clamp(17px, 1.08vw, 21px);\n      line-height: 1.16;\n      font-weight: 400;\n      letter-spacing: 0;\n      text-align: right;\n    }\n\n    .questionText > span {\n      text-align: right;\n      max-width: 100%;\n    }\n\n    .sliderRow {\n      width: 100%;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      direction: ltr;\n    }\n\n    .sliderScale {\n      width: min(520px, 100%);\n      direction: ltr;\n    }\n\n    .sliderTrackWrap {\n      position: relative;\n      width: 100%;\n      height: 24px;\n    }\n\n    input[type=\"range\"] {\n      -webkit-appearance: none;\n      appearance: none;\n      position: relative;\n      z-index: 2;\n      width: 100%;\n      height: 24px;\n      margin: 0;\n      background: transparent;\n      outline: none;\n      cursor: pointer;\n      touch-action: none;\n    }\n\n    input[type=\"range\"]::-webkit-slider-runnable-track {\n      height: 1px;\n      background: repeating-linear-gradient(\n        to right,\n        #111 0,\n        #111 10px,\n        transparent 10px,\n        transparent 27px\n      );\n    }\n\n    input[type=\"range\"]::-webkit-slider-thumb {\n      -webkit-appearance: none;\n      appearance: none;\n      width: 7px;\n      height: 7px;\n      border-radius: 0;\n      background: #111111;\n      border: 0;\n      margin-top: -3px;\n    }\n\n    input[type=\"range\"]::-moz-range-track {\n      height: 1px;\n      background: repeating-linear-gradient(\n        to right,\n        #111 0,\n        #111 10px,\n        transparent 10px,\n        transparent 27px\n      );\n    }\n\n    input[type=\"range\"]::-moz-range-thumb {\n      width: 7px;\n      height: 7px;\n      border-radius: 0;\n      background: #111111;\n      border: 0;\n    }\n\n    .scaleMarkers {\n      position: absolute;\n      z-index: 1;\n      inset: 9px 0 auto;\n      height: 7px;\n      pointer-events: none;\n    }\n\n    .scaleMarkers span {\n      position: absolute;\n      top: 0;\n      width: 5px;\n      height: 5px;\n      background: #111;\n      transform: translateX(-50%);\n    }\n\n    .scaleMarkers span:nth-child(1) { left: 0%; }\n    .scaleMarkers span:nth-child(2) { left: 25%; }\n    .scaleMarkers span:nth-child(3) { left: 50%; }\n    .scaleMarkers span:nth-child(4) { left: 75%; }\n    .scaleMarkers span:nth-child(5) { left: 100%; }\n\n    .anchorRow {\n      display: grid;\n      grid-template-columns: 1fr 1fr 1fr;\n      align-items: start;\n      margin-top: 5px;\n      direction: ltr;\n    }\n\n    .anchorItem {\n      min-width: 0;\n      font-size: 11px;\n      line-height: 1.18;\n      color: var(--muted);\n    }\n\n    .anchorItem:nth-child(1) { text-align: left; }\n    .anchorItem:nth-child(2) { text-align: center; }\n    .anchorItem:nth-child(3) { text-align: right; }\n\n    .anchorNumber {\n      display: block;\n      margin-bottom: 2px;\n      color: #111;\n      font-family: \"SimplerMono\", monospace;\n      font-size: 9px;\n      direction: ltr;\n    }\n\n    .anchorOverlap {\n      width: 100%;\n      min-height: 22px;\n      font-size: 11px;\n    }\n\n    .anchorOverlap > span {\n      white-space: normal;\n    }\n\n    .anchorItem:nth-child(1) .anchorOverlap > span { text-align: left; }\n    .anchorItem:nth-child(2) .anchorOverlap > span { text-align: center; }\n    .anchorItem:nth-child(3) .anchorOverlap > span { text-align: right; }\n\n    .hiddenValue {\n      display: none;\n    }\n\n    #sideLabelPane,\n    #languageTabs {\n      display: none !important;\n    }\n\n    #printButton {\n      position: absolute;\n      left: clamp(24px, 2vw, 38px);\n      bottom: clamp(20px, 2.2vh, 28px);\n      z-index: 10;\n      min-width: 118px;\n      border: 1px solid #231f20;\n      background: #231f20;\n      color: #ececec;\n      padding: 11px 22px 10px;\n      font-family: \"SimplerMono\", Arial, Helvetica, sans-serif;\n      font-size: clamp(12px, 0.85vw, 16px);\n      line-height: 1;\n      letter-spacing: 0.08em;\n      text-align: center;\n      cursor: pointer;\n    }\n\n    #printButton:hover,\n    #printButton:focus-visible {\n      background: transparent;\n      color: #231f20;\n      outline: none;\n    }\n\n    @media (min-width: 1600px) and (min-height: 850px) {\n      #questionsInner {\n        height: min(790px, calc(100% - 16px));\n      }\n\n      .sliderScale {\n        width: min(540px, 100%);\n      }\n    }\n\n    @media (max-width: 1380px) {\n      #topBar {\n        grid-template-columns: 155px minmax(0, 1fr) 250px;\n        padding-inline: 28px;\n      }\n\n      #wordNavigation {\n        gap: clamp(13px, 1.45vw, 22px);\n      }\n\n      .navWord {\n        min-width: 38px;\n        font-size: 14px;\n      }\n\n      #mainArea {\n        grid-template-columns: minmax(0, 1.66fr) minmax(450px, 1fr);\n      }\n\n      #questionsInner {\n        min-height: 610px;\n      }\n    }\n\n    @media (max-width: 1080px) {\n      html, body {\n        overflow: auto;\n      }\n\n      #topBar {\n        height: auto;\n        min-height: 104px;\n        grid-template-columns: 1fr auto;\n        gap: 14px 20px;\n        padding: 16px 24px;\n      }\n\n      #wordNavigation {\n        grid-column: 1 / -1;\n        grid-row: 2;\n        flex-wrap: wrap;\n        gap: 13px 24px;\n      }\n\n      #mainArea {\n        height: auto;\n        min-height: calc(100vh - 104px);\n        grid-template-columns: 1fr;\n        grid-template-rows: min(58vw, 56vh) auto;\n      }\n\n      #canvasPane {\n        border-right: 0;\n        border-bottom: 1px solid var(--line);\n      }\n\n      #questionsPane {\n        display: block;\n        padding: 42px 28px 60px;\n      }\n\n      #questionsInner {\n        height: auto;\n        min-height: 0;\n        display: block;\n      }\n\n      .questionBlock {\n        margin-bottom: 38px;\n      }\n    }\n\n    @media (max-width: 640px) {\n      #topBar {\n        grid-template-columns: 1fr;\n        justify-items: center;\n      }\n\n      #foundStatus,\n      #projectTitle {\n        justify-self: center;\n      }\n\n      #wordNavigation {\n        display: none;\n      }\n\n      #mainArea {\n        grid-template-rows: 44vh auto;\n      }\n\n      #questionsPane {\n        padding: 34px 20px 52px;\n      }\n\n      .questionText {\n        font-size: 16px;\n      }\n\n      .anchorItem {\n        font-size: 9px;\n      }\n    }\n\n    #printPage {\n      display: none;\n    }\n\n    #printTicketImage {\n      display: block;\n    }\n\n    @media print {\n      @page {\n        size: 148mm 105mm;\n        margin: 0;\n      }\n\n      html, body {\n        width: 148mm;\n        height: 105mm;\n        margin: 0 !important;\n        padding: 0 !important;\n        background: #ffffff !important;\n        overflow: hidden !important;\n      }\n\n      #topBar,\n      #mainArea {\n        display: none !important;\n      }\n\n      #printPage {\n        display: flex !important;\n        width: 148mm;\n        height: 105mm;\n        align-items: center;\n        justify-content: center;\n        background: #ffffff;\n        overflow: hidden;\n      }\n\n      #printTicketImage {\n        width: 148mm;\n        height: 105mm;\n        max-width: none;\n        max-height: none;\n        object-fit: fill;\n        image-rendering: auto;\n        display: block;\n        -webkit-print-color-adjust: exact;\n        print-color-adjust: exact;\n      }\n    }\n  </style>\n</head>\n<body>\n  <header id=\"topBar\">\n    <div id=\"foundStatus\" aria-label=\"0 מתוך 9 נמצאו / تم العثور على 0 من 9\">\n      <div id=\"foundNumber\" class=\"overlapText\" aria-hidden=\"true\">\n        <span class=\"hebrewLayer\" lang=\"he\">0/9</span>\n        <span class=\"arabicLayer\" lang=\"ar\">0/9</span>\n      </div>\n      <div id=\"foundOverlap\" class=\"overlapText\" aria-hidden=\"true\">\n        <span class=\"hebrewLayer\" lang=\"he\">נמצאו</span>\n        <span class=\"arabicLayer\" lang=\"ar\">تم العثور</span>\n      </div>\n    </div>\n\n    <nav id=\"wordNavigation\" aria-label=\"מילות הפרויקט / كلمات المشروع\">\n      <div class=\"navWord overlapText\"><span class=\"hebrewLayer\" lang=\"he\">גבול</span><span class=\"arabicLayer\" lang=\"ar\">حدود</span></div>\n      <div class=\"navWord overlapText\"><span class=\"hebrewLayer\" lang=\"he\">בית</span><span class=\"arabicLayer\" lang=\"ar\">بيت</span></div>\n      <div class=\"navWord overlapText\"><span class=\"hebrewLayer\" lang=\"he\">השתקפות</span><span class=\"arabicLayer\" lang=\"ar\">انعكاس</span></div>\n      <div class=\"navWord overlapText\"><span class=\"hebrewLayer\" lang=\"he\">זיכרון</span><span class=\"arabicLayer\" lang=\"ar\">ذاكرة</span></div>\n      <div class=\"navWord overlapText\"><span class=\"hebrewLayer\" lang=\"he\">אדמה</span><span class=\"arabicLayer\" lang=\"ar\">أرض</span></div>\n      <div class=\"navWord overlapText\"><span class=\"hebrewLayer\" lang=\"he\">זהות</span><span class=\"arabicLayer\" lang=\"ar\">هوية</span></div>\n      <div class=\"navWord overlapText\"><span class=\"hebrewLayer\" lang=\"he\">תרגום</span><span class=\"arabicLayer\" lang=\"ar\">ترجمة</span></div>\n      <div class=\"navWord overlapText\"><span class=\"hebrewLayer\" lang=\"he\">שפה</span><span class=\"arabicLayer\" lang=\"ar\">لغة</span></div>\n      <div class=\"navWord overlapText\"><span class=\"hebrewLayer\" lang=\"he\">שייכות</span><span class=\"arabicLayer\" lang=\"ar\">انتماء</span></div>\n    </nav>\n\n    <div id=\"projectTitle\" class=\"overlapText\" aria-label=\"ציפור מעופפת / عصفور طاير\">\n      <span id=\"titleHe\" class=\"hebrewLayer\" lang=\"he\" title=\"כרטיס בעברית\">ציפור מעופפת</span>\n      <span id=\"titleAr\" class=\"arabicLayer\" lang=\"ar\" title=\"البطاقة بالعربية\">عصفور طاير</span>\n    </div>\n  </header>\n\n  <main id=\"mainArea\">\n    <section id=\"canvasPane\">\n      <div id=\"canvasArea\"></div>\n      <button id=\"printButton\" type=\"button\" aria-label=\"Print A6 ticket\">PRINT</button>\n    </section>\n\n    <section id=\"questionsPane\">\n      <div id=\"questionsInner\"></div>\n    </section>\n\n    <aside id=\"sideLabelPane\">\n      <div class=\"sideWordWrap\">\n        <div class=\"sideWordPrimary\">انعكاس</div>\n        <div class=\"sideWordSecondary\">השתקפות</div>\n      </div>\n    </aside>\n  </main>\n\n  <section id=\"printPage\">\n    <img id=\"printTicketImage\" alt=\"Printed reflection ticket\" />\n  </section>\n\n<script>\nlet answers = [1, 2, 2, 2, 2];\nlet patternSeed = 24111;\nlet userSeed = 0;\nlet cnv;\nlet ticketG;\nlet ticketDirty = true;\nlet currentLang = \"he\";\nlet ticketLang = \"he\";\nlet ticketFont = null;\nlet fontReady = false;\n\nconst RED = \"#ff1d25\";\nconst BLUE = \"#00f0ff\";\nconst BLACK = \"#111111\";\nconst GRAY_BG = \"#ececec\";\nconst LIGHT_BLUE = \"#9bbbf8\";\nconst ARABIC_TEXT_COLOR = \"#ff3535\";\nconst HEBREW_TEXT_COLOR = \"#2ef5ff\";\nconst ANSWER_BLOCK_COLOR = \"#231f20\";\n\n// True A6 landscape dimensions.\n// 148 × 105 mm rendered at 300 DPI = 1748 × 1240 pixels.\nconst A6_WIDTH_MM = 148;\nconst A6_HEIGHT_MM = 105;\nconst EXPORT_DPI = 300;\nconst PRINT_W = Math.round((A6_WIDTH_MM / 25.4) * EXPORT_DPI);\nconst PRINT_H = Math.round((A6_HEIGHT_MM / 25.4) * EXPORT_DPI);\nconst PRINT_RATIO = PRINT_H / PRINT_W;\n\n// Five square pattern modules stacked vertically in each strip.\nconst PATTERN_BLOCK_COUNT = 5;\nconst PATTERN_STRIP_COUNT = 2;\n\nconst CONTENT = {\n  he: {\n    foundStatusText: \"נמצאו\",\n    questions: [\n      \"1. עד כמה המשמעות של מה שאת/ה רוצה לומר משתנה במעבר בין שפה אחת לאחרת?\",\n      \"2. עד כמה את/ה מרגיש/ה שגרסה אחרת שלך מופיעה בכל שפה?\",\n      \"3. עד כמה את/ה מרגיש/ה שאחרים מבינים אותך אחרת כשאת/ה מדבר/ת בשפה שונה?\",\n      \"4. עד כמה השפה שבה את/ה מדבר/ת משפיעה על תחושת השייכות שלך?\",\n      \"5. עד כמה יש בך דברים שאף שפה אינה מצליחה לבטא במלואם?\"\n    ],\n    scaleAnchors: [\n      { value: \"1\", text: \"כמעט בכלל לא\" },\n      { value: \"3\", text: \"לפעמים\" },\n      { value: \"5\", text: \"במידה רבה מאוד\" }\n    ],\n    ticketTitle: \"בין השפות\",\n    ticketVersion: \"פרויקט גמר 2026\",\n    reflectionLabel: \"קריאה אישית\",\n    noteLabel: \"נבנה מחמש התשובות שלך\",\n    footerNote: \"התוצאה מתארת את אופן התגובה שלך ברגע זה; היא אינה קביעה קבועה.\",\n    barcodeLabel: \"השתקפות\",\n    labels: [\n      \"מה עובר בין השפות\",\n      \"איך את/ה משתנה\",\n      \"איך אחרים מבינים אותך\",\n      \"איך השפה משפיעה על שייכות\",\n      \"מה קשה לבטא\"\n    ],\n    shortLabels: [\n      \"משמעות\",\n      \"שינוי\",\n      \"הבנה\",\n      \"שייכות\",\n      \"ביטוי\"\n    ],\n    statements: [\n      [\n        \"המילים כמעט נשארות שלמות.\",\n        \"רק מעט משתנה בדרך.\",\n        \"חלק מהכוונה מתחלף.\",\n        \"המשמעות מגיעה חלקית.\",\n        \"הרבה נשאר מאחור.\"\n      ],\n      [\n        \"אותו קול מלווה אותך.\",\n        \"הטון משתנה מעט.\",\n        \"צד אחר בך מופיע.\",\n        \"כל שפה משנה את הנוכחות שלך.\",\n        \"בכל שפה מופיעה גרסה אחרת שלך.\"\n      ],\n      [\n        \"רוב האנשים שומעים את כוונתך.\",\n        \"לפעמים משהו נקרא אחרת.\",\n        \"חלק ממך מתפספס.\",\n        \"הנחות קודמות נכנסות לשיחה.\",\n        \"את/ה נזהר/ת לפני כל משפט.\"\n      ],\n      [\n        \"השייכות נשארת יציבה.\",\n        \"הנוחות משתנה מעט.\",\n        \"המקום משנה את התחושה.\",\n        \"השפה פותחת או סוגרת מרחב.\",\n        \"השייכות תלויה באופן שבו את/ה נשמע/ת.\"\n      ],\n      [\n        \"רוב הדברים מוצאים מילים.\",\n        \"מעט נשאר בפנים.\",\n        \"יש דברים בלי ניסוח שלם.\",\n        \"הרבה נשאר שקט.\",\n        \"הדברים הכבדים ביותר נשארים בלי שם.\"\n      ]\n    ],\n    reflectionSystem: {\n      opening: {\n        low: [\n          \"את/ה עובר/ת בין השפות בלי לאבד את הכיוון שלך. הצליל משתנה, אבל מה שרצית לומר נשאר קרוב למקור.\",\n          \"המעבר בין השפות טבעי לך יחסית. המילים מתחלפות, אך הקול שמאחוריהן נשאר מוכר וברור.\"\n        ],\n        mid: [\n          \"בכל שפה הקול שלך מקבל גוון מעט אחר. את/ה מתאים/ה את המילים למקום ולאנשים, אך שומר/ת על חוט שמחבר בין הגרסאות.\",\n          \"המעבר בין השפות משנה אצלך את הקצב ואת מידת החשיפה. לא הכול משתנה, אבל בכל מרחב מופיע צד מעט אחר שלך.\"\n        ],\n        high: [\n          \"המעבר בין שפות דורש ממך בחירה מחודשת בכל פעם. חלקים מסוימים נעשים ברורים יותר, ואחרים נסוגים כדי שתוכל/י להישמע ולהיות מובן/ת.\",\n          \"בכל שפה את/ה בונה מחדש את הדרך שבה תופסים אותך. המאמץ אינו רק למצוא מילים, אלא גם לבחור מה יופיע ומה יישאר ברקע.\"\n        ]\n      },\n      dimensions: [\n        {\n          low: [\"רוב המשמעות עוברת איתך, ולכן אינך נדרש/ת לוותר על הרבה בדרך.\"],\n          mid: [\"העיקר מגיע, אך כמה גוונים דקים נשארים מאחור או מקבלים צורה אחרת.\"],\n          high: [\"מה שמגיע לאחרים הוא רק חלק ממה שהתכוונת לשאת איתך.\"]\n        },\n        {\n          low: [\"הנוכחות שלך נשארת דומה גם כשהשפה מתחלפת.\"],\n          mid: [\"כל שפה מזמינה צד מעט אחר שלך, בלי למחוק את הצדדים האחרים.\"],\n          high: [\"כל שפה מציבה אותך במקום אחר ומבליטה גרסה שונה שלך.\"]\n        },\n        {\n          low: [\"ברוב המקרים הכוונה שלך נקראת כפי שרצית.\"],\n          mid: [\"לפעמים אחרים פוגשים רק שכבה אחת, ואת/ה משלים/ה את החסר תוך כדי.\"],\n          high: [\"המבט של אחרים נכנס בין המילים ומשנה את האופן שבו שומעים אותך.\"]\n        },\n        {\n          low: [\"תחושת המקום שלך אינה תלויה מאוד בשפה שבה דיברת.\"],\n          mid: [\"הנוחות והשייכות משתנות לפי הסביבה ולפי מי שנמצא מולך.\"],\n          high: [\"השפה משפיעה על המקום שבו את/ה מרשה לעצמך להיפתח ולהרגיש חלק.\"]\n        },\n        {\n          low: [\"רוב הדברים החשובים מצליחים לקבל מילים.\"],\n          mid: [\"יש חוויות שמגיעות רק עד קצה המשפט ונשארות שם.\"],\n          high: [\"חלקים משמעותיים נשארים בלי ניסוח מלא, אך ממשיכים להיות נוכחים.\"]\n        }\n      ],\n      anchors: [\n        [\"הדיוק נשאר נקודת יציבות עבורך.\"],\n        [\"הקול שלך נשאר מוכר גם כשהמסגרת משתנה.\"],\n        [\"יש לך ביטחון יחסי באופן שבו הכוונה שלך נקלטת.\"],\n        [\"יש בך תחושת מקום שאינה תלויה רק בשפה.\"],\n        [\"כשמשהו חשוב באמת, את/ה עדיין מוצא/ת דרך לומר אותו.\"]\n      ],\n      closing: {\n        contrast: [\n          \"הפער בין התשובות מראה שלא כל מרחב דורש ממך אותו מאמץ; יש מקומות שבהם את/ה נושם/ת בחופשיות, ואחרים שבהם כל מילה נשקלת.\",\n          \"החוויה שלך משתנה מאוד לפי ההקשר. במקומות מסוימים הדברים זורמים, ובאחרים את/ה נדרש/ת לעצור, לבדוק ולבחור מחדש.\"\n        ],\n        even: [\n          \"התשובות שלך קרובות זו לזו, ולכן החוויה אינה נשלטת בידי מוקד אחד. היא נבנית מצירוף שקט של התאמות קטנות שחוזרות לאורך היום.\",\n          \"אין גורם יחיד שמוביל את התוצאה שלך. המשמעות, הקול, המבט והשייכות נעים יחד ומשפיעים זה על זה במידה דומה.\"\n        ],\n        balanced: [\n          \"שני מוקדים בולטים יותר מן האחרים, אך הם אינם מספרים את כל הסיפור. הם מצביעים על המקומות שבהם המעבר בין שפות מורגש אצלך במיוחד.\",\n          \"התוצאה שלך מאוזנת, אך שני אזורים דורשים יותר תשומת לב. שם את/ה מרגיש/ה באופן הברור ביותר את המרחק בין מה שרצית לומר לבין מה שהצליח להגיע.\"\n        ]\n      }\n    }\n  },\n  ar: {\n    foundStatusText: \"تم العثور\",\n    questions: [\n      \"1. إلى أي مدى يتغيّر معنى ما تريد/ين قوله عند الانتقال من لغة إلى أخرى؟\",\n      \"2. إلى أي مدى تشعر/ين أن نسخة أخرى منك تظهر في كل لغة؟\",\n      \"3. إلى أي مدى تشعر/ين أن الآخرين يفهمونك بشكل مختلف عندما تتحدث/ين بلغة أخرى؟\",\n      \"4. إلى أي مدى تؤثر اللغة التي تتحدث/ين بها في إحساسك بالانتماء؟\",\n      \"5. إلى أي مدى توجد فيك أشياء لا تستطيع أي لغة التعبير عنها بالكامل؟\"\n    ],\n    scaleAnchors: [\n      { value: \"1\", text: \"تقريبًا أبدًا\" },\n      { value: \"3\", text: \"أحيانًا\" },\n      { value: \"5\", text: \"إلى حد كبير جدًا\" }\n    ],\n    ticketTitle: \"بين اللغات\",\n    ticketVersion: \"مشروع تخرج 2026\",\n    reflectionLabel: \"قراءة شخصية\",\n    noteLabel: \"مبنية على إجاباتك الخمس\",\n    footerNote: \"النتيجة تصف أسلوب استجابتك في هذه اللحظة؛ وليست حكمًا ثابتًا.\",\n    barcodeLabel: \"انعكاس\",\n    labels: [\n      \"ما الذي ينتقل بين اللغات\",\n      \"كيف تتغير/ين\",\n      \"كيف يفهمك الآخرون\",\n      \"كيف تؤثر اللغة في الانتماء\",\n      \"ما الذي يصعب التعبير عنه\"\n    ],\n    shortLabels: [\n      \"معنى\",\n      \"تغيّر\",\n      \"فهم\",\n      \"انتماء\",\n      \"تعبير\"\n    ],\n    statements: [\n      [\n        \"تبقى الكلمات شبه كاملة.\",\n        \"يتغير القليل في الطريق.\",\n        \"يتبدل جزء من القصد.\",\n        \"يصل المعنى بشكل جزئي.\",\n        \"يبقى الكثير خلفك.\"\n      ],\n      [\n        \"يرافقك الصوت نفسه.\",\n        \"تتغير النبرة قليلًا.\",\n        \"يظهر جانب آخر منك.\",\n        \"كل لغة تغيّر حضورك.\",\n        \"في كل لغة تظهر نسخة أخرى منك.\"\n      ],\n      [\n        \"غالبًا يسمع الآخرون قصدك.\",\n        \"أحيانًا يُقرأ شيء بشكل آخر.\",\n        \"يضيع جزء منك في الفهم.\",\n        \"تدخل الافتراضات إلى الحديث.\",\n        \"تتأنى قبل كل جملة.\"\n      ],\n      [\n        \"يبقى انتماؤك ثابتًا.\",\n        \"تتغير الراحة قليلًا.\",\n        \"يغيّر المكان الإحساس.\",\n        \"تفتح اللغة مساحة أو تغلقها.\",\n        \"يتعلق الانتماء بالطريقة التي تُسمع بها.\"\n      ],\n      [\n        \"تجد معظم الأشياء كلماتها.\",\n        \"يبقى القليل في الداخل.\",\n        \"هناك أمور بلا صياغة كاملة.\",\n        \"يبقى الكثير صامتًا.\",\n        \"أثقل ما فيك يبقى أحيانًا بلا اسم.\"\n      ]\n    ],\n    reflectionSystem: {\n      opening: {\n        low: [\n          \"تتنقل/ين بين اللغات من دون أن تفقد/ي اتجاهك. يتغيّر الصوت، لكن ما أردت قوله يبقى قريبًا من أصله.\",\n          \"الانتقال بين اللغات طبيعي لديك نسبيًا. تتبدل الكلمات، لكن الصوت الذي خلفها يبقى مألوفًا وواضحًا.\"\n        ],\n        mid: [\n          \"في كل لغة يكتسب صوتك نبرة مختلفة قليلًا. تعدّل/ين الكلمات بحسب المكان ومن أمامك، لكنك تحافظ/ين على خيط يصل بين النسخ المختلفة.\",\n          \"الانتقال بين اللغات يغيّر الإيقاع ودرجة انكشافك. لا يتغير كل شيء، لكن جانبًا مختلفًا منك يظهر في كل مساحة.\"\n        ],\n        high: [\n          \"الانتقال بين اللغات يطلب منك اختيارًا جديدًا في كل مرة. تصبح بعض الجوانب أوضح، وتتراجع أخرى كي تتمكن/ي من أن تُسمع/ي وأن تُفهم/ي.\",\n          \"في كل لغة تعيد/ين بناء الطريقة التي يراك بها الآخرون. الجهد ليس في إيجاد الكلمات فقط، بل في اختيار ما سيظهر وما سيبقى في الخلف.\"\n        ]\n      },\n      dimensions: [\n        {\n          low: [\"يصل معظم المعنى معك، لذلك لا تضطر/ين إلى ترك الكثير في الطريق.\"],\n          mid: [\"يصل الأساس، لكن بعض التفاصيل الدقيقة تبقى خلفك أو تأخذ شكلًا آخر.\"],\n          high: [\"ما يصل إلى الآخرين ليس إلا جزءًا مما أردت حمله معك.\"]\n        },\n        {\n          low: [\"يبقى حضورك قريبًا من نفسه حتى عندما تتبدل اللغة.\"],\n          mid: [\"تدعو كل لغة جانبًا مختلفًا قليلًا منك، من دون أن تمحو الجوانب الأخرى.\"],\n          high: [\"تضعك كل لغة في موقع مختلف وتبرز نسخة أخرى منك.\"]\n        },\n        {\n          low: [\"في معظم الأحيان يُفهم قصدك كما أردت.\"],\n          mid: [\"أحيانًا يرى الآخرون طبقة واحدة فقط، فتكمّل/ين ما ينقص أثناء الحديث.\"],\n          high: [\"تدخل نظرة الآخرين بين الكلمات وتغيّر الطريقة التي يُسمع بها صوتك.\"]\n        },\n        {\n          low: [\"إحساسك بالمكان لا يعتمد كثيرًا على اللغة التي تتحدث/ين بها.\"],\n          mid: [\"تتبدل الراحة والانتماء بحسب المحيط وبحسب من يقف أمامك.\"],\n          high: [\"تؤثر اللغة في المكان الذي تسمح/ين فيه لنفسك بالانفتاح والشعور بأنك جزء منه.\"]\n        },\n        {\n          low: [\"تنجح معظم الأمور المهمة في العثور على كلماتها.\"],\n          mid: [\"هناك تجارب تصل إلى حافة الجملة ثم تبقى هناك.\"],\n          high: [\"تبقى أجزاء مهمة من دون صياغة كاملة، لكنها تظل حاضرة فيك.\"]\n        }\n      ],\n      anchors: [\n        [\"تبقى الدقة نقطة ثبات لديك.\"],\n        [\"يبقى صوتك مألوفًا حتى عندما يتغير الإطار.\"],\n        [\"لديك ثقة نسبية في الطريقة التي يصل بها قصدك.\"],\n        [\"لديك إحساس بالمكان لا يعتمد على اللغة وحدها.\"],\n        [\"عندما يكون الأمر مهمًا، تجد/ين طريقة لقول ما تريد/ين.\"]\n      ],\n      closing: {\n        contrast: [\n          \"الفارق بين الإجابات يبيّن أن كل مساحة لا تطلب منك الجهد نفسه؛ في أماكن تتنفس/ين بحرية، وفي أخرى تزن/ين كل كلمة.\",\n          \"تتغير تجربتك كثيرًا بحسب السياق. في بعض الأماكن تسير الأمور بسهولة، وفي أخرى تتوقف/ين لتراجع/ي وتختار/ي من جديد.\"\n        ],\n        even: [\n          \"إجاباتك متقاربة، لذلك لا يسيطر محور واحد على تجربتك. تتكوّن النتيجة من مجموعة هادئة من التعديلات الصغيرة التي تتكرر خلال اليوم.\",\n          \"لا يوجد عامل واحد يقود نتيجتك. المعنى والصوت ونظرة الآخرين والانتماء تتحرك معًا وتؤثر في بعضها بدرجات متقاربة.\"\n        ],\n        balanced: [\n          \"يظهر محوران أكثر من غيرهما، لكنهما لا يرويان القصة كاملة. إنهما يشيران إلى الأماكن التي تشعر/ين فيها بوضوح أكبر بالانتقال بين اللغات.\",\n          \"نتيجتك متوازنة، لكن جانبين يحتاجان إلى انتباه أكبر. هناك تشعر/ين بوضوح بالمسافة بين ما أردت قوله وما استطاع الوصول.\"\n        ]\n      }\n    }\n  }\n};\n\nfunction setup() {\n  const area = document.getElementById(\"canvasArea\");\n  cnv = createCanvas(area.clientWidth, area.clientHeight);\n  cnv.parent(\"canvasArea\");\n  pixelDensity(1);\n  noSmooth();\n  imageMode(CORNER);\n\n  ticketG = createGraphics(PRINT_W, PRINT_H);\n  ticketG.pixelDensity(1);\n  ticketG.noSmooth();\n\n  // One random identity seed per visitor. It stays stable while that visitor\n  // changes answers during the current session.\n  userSeed = generateUserSeed();\n\n  setupQuestionsUI();\n  setupLanguageTabs();\n  setupPrintControl();\n  updateLanguageUI();\n  tryLoadFont();\n  markTicketDirty();\n}\n\nfunction tryLoadFont() {\n  // Use the CSS @font-face instead of p5.loadFont(). p5.Font draws glyph paths\n  // in source order and does not reliably apply Arabic/Hebrew bidi shaping.\n  // Native Canvas text with direction=\"rtl\" keeps letters connected and ordered.\n  if (document.fonts && document.fonts.load) {\n    document.fonts\n      .load('32px \"SimplerMono\"')\n      .then(function() {\n        fontReady = true;\n        markTicketDirty();\n      })\n      .catch(function() {\n        console.warn(\"Could not load SimplerPro_HLAR_Mono-Regular 2.otf. Falling back to Arial.\");\n        fontReady = false;\n        markTicketDirty();\n      });\n  } else {\n    fontReady = false;\n    markTicketDirty();\n  }\n}\n\nfunction draw() {\n  background(GRAY_BG);\n  if (ticketDirty) {\n    renderHighResolutionTicket();\n  }\n  drawTicketPreview();\n}\n\nfunction setupLanguageTabs() {\n  const titleHe = document.getElementById(\"titleHe\");\n  const titleAr = document.getElementById(\"titleAr\");\n\n  if (titleHe) {\n    titleHe.addEventListener(\"click\", function(event) {\n      event.stopPropagation();\n      currentLang = \"he\";\n      updateLanguageUI();\n    });\n  }\n\n  if (titleAr) {\n    titleAr.addEventListener(\"click\", function(event) {\n      event.stopPropagation();\n      currentLang = \"ar\";\n      updateLanguageUI();\n    });\n  }\n}\n\nfunction updateLanguageUI() {\n  ticketLang = currentLang;\n  document.body.dataset.ticketLanguage = currentLang;\n  markTicketDirty();\n}\n\nfunction renderQuestions() {\n  const panel = document.getElementById(\"questionsInner\");\n  const hebrewQuestions = CONTENT.he.questions;\n  const arabicQuestions = CONTENT.ar.questions;\n  const hebrewAnchors = CONTENT.he.scaleAnchors;\n  const arabicAnchors = CONTENT.ar.scaleAnchors;\n  panel.innerHTML = \"\";\n\n  for (let i = 0; i < hebrewQuestions.length; i++) {\n    const block = document.createElement(\"section\");\n    block.className = \"questionBlock\";\n    block.setAttribute(\"aria-labelledby\", \"question-he-\" + (i + 1));\n\n    const qText = document.createElement(\"div\");\n    qText.className = \"questionText overlapText\";\n\n    const qHe = document.createElement(\"span\");\n    qHe.className = \"hebrewLayer\";\n    qHe.lang = \"he\";\n    qHe.id = \"question-he-\" + (i + 1);\n    qHe.textContent = hebrewQuestions[i];\n\n    const qAr = document.createElement(\"span\");\n    qAr.className = \"arabicLayer\";\n    qAr.lang = \"ar\";\n    qAr.textContent = arabicQuestions[i];\n\n    qText.appendChild(qHe);\n    qText.appendChild(qAr);\n\n    const row = document.createElement(\"div\");\n    row.className = \"sliderRow\";\n\n    const scale = document.createElement(\"div\");\n    scale.className = \"sliderScale\";\n\n    const trackWrap = document.createElement(\"div\");\n    trackWrap.className = \"sliderTrackWrap\";\n\n    const slider = document.createElement(\"input\");\n    slider.type = \"range\";\n    slider.min = \"1\";\n    slider.max = \"5\";\n    slider.step = \"1\";\n    slider.value = String(answers[i]);\n    slider.id = \"q\" + (i + 1);\n    slider.setAttribute(\"aria-label\", hebrewQuestions[i] + \" / \" + arabicQuestions[i]);\n    slider.setAttribute(\"aria-valuetext\", String(answers[i]));\n\n    const markers = document.createElement(\"div\");\n    markers.className = \"scaleMarkers\";\n    markers.setAttribute(\"aria-hidden\", \"true\");\n    for (let markerIndex = 0; markerIndex < 5; markerIndex++) {\n      markers.appendChild(document.createElement(\"span\"));\n    }\n\n    const anchorRow = document.createElement(\"div\");\n    anchorRow.className = \"anchorRow\";\n\n    for (let anchorIndex = 0; anchorIndex < 3; anchorIndex++) {\n      const anchorItem = document.createElement(\"div\");\n      anchorItem.className = \"anchorItem\";\n\n      const anchorNumber = document.createElement(\"span\");\n      anchorNumber.className = \"anchorNumber\";\n      anchorNumber.textContent = hebrewAnchors[anchorIndex].value;\n\n      const anchorOverlap = document.createElement(\"div\");\n      anchorOverlap.className = \"anchorOverlap overlapText\";\n\n      const anchorHe = document.createElement(\"span\");\n      anchorHe.className = \"hebrewLayer\";\n      anchorHe.lang = \"he\";\n      anchorHe.textContent = hebrewAnchors[anchorIndex].text;\n\n      const anchorAr = document.createElement(\"span\");\n      anchorAr.className = \"arabicLayer\";\n      anchorAr.lang = \"ar\";\n      anchorAr.textContent = arabicAnchors[anchorIndex].text;\n\n      anchorOverlap.appendChild(anchorHe);\n      anchorOverlap.appendChild(anchorAr);\n      anchorItem.appendChild(anchorNumber);\n      anchorItem.appendChild(anchorOverlap);\n      anchorRow.appendChild(anchorItem);\n    }\n\n    const value = document.createElement(\"div\");\n    value.className = \"hiddenValue\";\n    value.id = \"v\" + (i + 1);\n    value.textContent = String(answers[i]);\n\n    slider.addEventListener(\"input\", function() {\n      answers[i] = Number(slider.value);\n      value.textContent = slider.value;\n      slider.setAttribute(\"aria-valuetext\", slider.value);\n      markTicketDirty();\n    });\n\n    trackWrap.appendChild(markers);\n    trackWrap.appendChild(slider);\n    scale.appendChild(trackWrap);\n    scale.appendChild(anchorRow);\n    row.appendChild(scale);\n\n    block.appendChild(qText);\n    block.appendChild(row);\n    block.appendChild(value);\n    panel.appendChild(block);\n  }\n}\n\nfunction setupQuestionsUI() {\n  renderQuestions();\n}\n\nfunction markTicketDirty() {\n  patternSeed = makeSeedFromAnswers();\n  ticketDirty = true;\n}\n\nfunction generateUserSeed() {\n  // crypto gives different visitors different patterns even when their answers match.\n  if (window.crypto && window.crypto.getRandomValues) {\n    const values = new Uint32Array(1);\n    window.crypto.getRandomValues(values);\n    return values[0] % 900000 + 100000;\n  }\n\n  return Math.floor((Date.now() + Math.random() * 1000000) % 900000) + 100000;\n}\n\nfunction makeSeedFromAnswers() {\n  const answerSeed =\n    answers[0] * 101 +\n    answers[1] * 1009 +\n    answers[2] * 2017 +\n    answers[3] * 3011 +\n    answers[4] * 4001;\n\n  // Keep the visitor-specific seed and answer structure in the same deterministic code.\n  return Math.abs((userSeed * 37 + answerSeed * 97) % 100000000);\n}\n\nfunction windowResized() {\n  const area = document.getElementById(\"canvasArea\");\n  resizeCanvas(area.clientWidth, area.clientHeight);\n}\n\nfunction setupPrintControl() {\n  const printButton = document.getElementById(\"printButton\");\n\n  if (printButton) {\n    printButton.addEventListener(\"click\", finishAndPrint);\n  }\n\n  // Global listener works even while a slider or another control has focus.\n  window.addEventListener(\"keydown\", function(event) {\n    if (\n      event.key.toLowerCase() === \"p\" &&\n      !event.ctrlKey &&\n      !event.metaKey &&\n      !event.altKey\n    ) {\n      event.preventDefault();\n      finishAndPrint();\n    }\n  });\n}\n\nfunction drawTicketPreview() {\n  const maxW = Math.min(width * 0.78, 820);\n  const fitByWidth = width * 0.62;\n  const fitByHeight = height * 0.72 / PRINT_RATIO;\n\n  let previewW = Math.min(fitByWidth, fitByHeight, maxW);\n  previewW = Math.max(240, previewW);\n\n  const previewH = previewW * PRINT_RATIO;\n  const x = width / 2 - previewW / 2;\n  const y = height / 2 - previewH / 2;\n\n  image(ticketG, x, y, previewW, previewH);\n}\n\nfunction finishAndPrint() {\n  renderHighResolutionTicket();\n\n  const canvasForExport = ticketG.canvas || ticketG.elt;\n  const dataUrl = canvasForExport.toDataURL(\"image/png\");\n\n  // Use a dedicated print window with a strict A6 landscape page definition.\n  // This is more reliable than trying to print the interactive UI page itself.\n  const printWindow = window.open(\"\", \"reflectionTicketPrint\", \"width=900,height=700\");\n\n  if (!printWindow) {\n    alert(\"Please allow pop-ups so the A6 print window can open.\");\n    return;\n  }\n\n  const printHtml = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\" />\n  <title>Print A6 Ticket</title>\n  <style>\n    @page {\n      size: 148mm 105mm;\n      margin: 0;\n    }\n    html, body {\n      margin: 0;\n      padding: 0;\n      width: 148mm;\n      height: 105mm;\n      overflow: hidden;\n      background: #ffffff;\n    }\n    body {\n      display: flex;\n      align-items: center;\n      justify-content: center;\n    }\n    img {\n      display: block;\n      width: 148mm;\n      height: 105mm;\n      object-fit: fill;\n      image-rendering: auto;\n      -webkit-print-color-adjust: exact;\n      print-color-adjust: exact;\n    }\n  </style>\n</head>\n<body>\n  <img id=\"ticketImage\" src=\"${dataUrl}\" alt=\"A6 ticket\" />\n  <script>\n    const img = document.getElementById(\"ticketImage\");\n    function runPrint() {\n      setTimeout(function() {\n        window.focus();\n        window.print();\n      }, 80);\n    }\n    if (img.complete) {\n      runPrint();\n    } else {\n      img.onload = runPrint;\n    }\n    window.onafterprint = function() { window.close(); };\n  <\\/script>\n</body>\n</html>`;\n\n  printWindow.document.open();\n  printWindow.document.write(printHtml);\n  printWindow.document.close();\n}\n\nfunction saveHighResTicketPNG() {\n  renderHighResolutionTicket();\n\n  const canvasForExport = ticketG.canvas || ticketG.elt;\n\n  canvasToPngBlobWithDpi(canvasForExport, EXPORT_DPI)\n    .then(function(blob) {\n      const link = document.createElement(\"a\");\n      const url = URL.createObjectURL(blob);\n\n      link.download =\n        \"my_reflection_A6_landscape_300dpi_\" + patternSeed + \".png\";\n      link.href = url;\n      document.body.appendChild(link);\n      link.click();\n      link.remove();\n\n      setTimeout(function() {\n        URL.revokeObjectURL(url);\n      }, 1000);\n    })\n    .catch(function(error) {\n      console.error(\"Could not save the A6 PNG with DPI metadata:\", error);\n\n      // Safe fallback: the pixel dimensions are still exact A6 at 300 DPI.\n      const link = document.createElement(\"a\");\n      link.download =\n        \"my_reflection_A6_landscape_1748x1240_\" + patternSeed + \".png\";\n      link.href = canvasForExport.toDataURL(\"image/png\");\n      link.click();\n    });\n}\n\n/**\n * Exports the canvas as a PNG and inserts a pHYs chunk so design/print\n * applications recognize the file as 300 DPI, not merely as a pixel image.\n */\nasync function canvasToPngBlobWithDpi(canvasElement, dpi) {\n  const originalBlob = await new Promise(function(resolve, reject) {\n    canvasElement.toBlob(function(blob) {\n      if (blob) resolve(blob);\n      else reject(new Error(\"Canvas PNG export returned no data.\"));\n    }, \"image/png\");\n  });\n\n  const originalBytes = new Uint8Array(await originalBlob.arrayBuffer());\n  const pngBytes = insertPngPhysicalResolution(originalBytes, dpi);\n\n  return new Blob([pngBytes], { type: \"image/png\" });\n}\n\nfunction insertPngPhysicalResolution(pngBytes, dpi) {\n  const PNG_SIGNATURE_LENGTH = 8;\n  const IHDR_TOTAL_LENGTH = 25; // 4 length + 4 type + 13 data + 4 CRC\n  const insertAt = PNG_SIGNATURE_LENGTH + IHDR_TOTAL_LENGTH;\n  const pixelsPerMeter = Math.round(dpi / 0.0254);\n\n  const data = new Uint8Array(9);\n  writeUint32BE(data, 0, pixelsPerMeter);\n  writeUint32BE(data, 4, pixelsPerMeter);\n  data[8] = 1; // Unit specifier: metres\n\n  const type = new Uint8Array([112, 72, 89, 115]); // \"pHYs\"\n  const chunk = new Uint8Array(4 + 4 + data.length + 4);\n\n  writeUint32BE(chunk, 0, data.length);\n  chunk.set(type, 4);\n  chunk.set(data, 8);\n\n  const crcInput = new Uint8Array(type.length + data.length);\n  crcInput.set(type, 0);\n  crcInput.set(data, type.length);\n  writeUint32BE(chunk, 8 + data.length, crc32(crcInput));\n\n  const output = new Uint8Array(pngBytes.length + chunk.length);\n  output.set(pngBytes.slice(0, insertAt), 0);\n  output.set(chunk, insertAt);\n  output.set(pngBytes.slice(insertAt), insertAt + chunk.length);\n\n  return output;\n}\n\nfunction writeUint32BE(bytes, offset, value) {\n  bytes[offset] = (value >>> 24) & 255;\n  bytes[offset + 1] = (value >>> 16) & 255;\n  bytes[offset + 2] = (value >>> 8) & 255;\n  bytes[offset + 3] = value & 255;\n}\n\nfunction crc32(bytes) {\n  let crc = 0xffffffff;\n\n  for (let i = 0; i < bytes.length; i++) {\n    crc ^= bytes[i];\n\n    for (let bit = 0; bit < 8; bit++) {\n      const mask = -(crc & 1);\n      crc = (crc >>> 1) ^ (0xedb88320 & mask);\n    }\n  }\n\n  return (crc ^ 0xffffffff) >>> 0;\n}\n\nfunction resetAnswers() {\n  ticketLang = currentLang;\n  answers = [1, 2, 2, 2, 2];\n\n  // RESET means a new visitor, so the same answer set does not repeat the previous pattern.\n  userSeed = generateUserSeed();\n\n  renderQuestions();\n  markTicketDirty();\n}\n\nfunction renderHighResolutionTicket() {\n  ticketG.clear();\n  ticketG.background(255);\n  ticketG.noSmooth();\n  drawTicketOn(ticketG, 0, 0, PRINT_W, PRINT_H);\n  ticketDirty = false;\n}\n\nfunction getTicketLayout(x, y, w, h) {\n  // Exact landscape proportions taken from the approved reference layout.\n  // The pattern nearly bleeds on three sides; the text has a compact left margin.\n  const pagePadding = w * 0.024;\n  const headerY = y + h * 0.079;\n\n  const patternY = y + h * 0.009;\n  const patternH = h * 0.974;\n\n  // The pattern area is made from two adjacent square strips. Each strip holds\n  // five square modules stacked vertically, matching the approved reference.\n  const singleStripW = patternH / PATTERN_BLOCK_COUNT;\n  const patternGap = Math.max(0, w * 0.0008);\n  const patternW = singleStripW * PATTERN_STRIP_COUNT + patternGap * (PATTERN_STRIP_COUNT - 1);\n  const patternRight = x + w * 0.992;\n  const patternX = patternRight - patternW;\n\n  const contentX = x + w * 0.024;\n  // Keep the text block closer to the pattern, following the approved reference.\n  const contentRight = patternX - w * 0.026;\n  const contentW = contentRight - contentX;\n  const columnGap = patternX - contentRight;\n\n  return {\n    pagePadding,\n    columnGap,\n    headerY,\n    patternX,\n    patternY,\n    patternW,\n    patternH,\n    singleStripW,\n    patternGap,\n    contentX,\n    contentRight,\n    contentW\n  };\n}\n\nfunction drawTicketOn(g, x, y, w, h) {\n  const layout = getTicketLayout(x, y, w, h);\n\n  g.push();\n\n  // No frame. The page edge and internal alignment create the structure.\n  g.background(255);\n  g.noStroke();\n\n  drawTicketHeaderOn(g, x, y, w, h, layout);\n  drawPatternOn(g, x, y, w, h, layout);\n  drawTicketBodyOn(g, x, y, w, h, layout);\n  drawBarcodeOn(g, x, y, w, h, layout);\n\n  g.pop();\n}\n\nfunction drawTicketHeaderOn(g, x, y, w, h, layout) {\n  const he = CONTENT.he;\n  const ar = CONTENT.ar;\n\n  g.push();\n  g.textFont(getTicketFont());\n  g.noStroke();\n  g.textStyle(BOLD);\n  g.textSize(h * 0.058);\n\n  drawBilingualRTLText(\n    g,\n    he.ticketTitle,\n    ar.ticketTitle,\n    layout.contentRight,\n    layout.headerY,\n    {\n      baseline: \"middle\",\n      offset: h * 0.0016\n    }\n  );\n\n  // The project marker is intentionally omitted from the printed face so the\n  // title keeps the same clean top spacing as the approved reference.\n  g.pop();\n}\n\nfunction getTicketFont() {\n  // A font-family string forces p5 to use the browser's native Canvas text\n  // renderer, which supports RTL ordering and Arabic contextual shaping.\n  return fontReady ? \"SimplerMono\" : \"Arial\";\n}\n\nfunction drawCanvasText(g, textValue, x, y, options) {\n  const opts = options || {};\n  const ctx = g.drawingContext;\n\n  ctx.save();\n  ctx.direction = opts.direction || \"rtl\";\n  ctx.textAlign = opts.align || \"right\";\n  ctx.textBaseline = opts.baseline || \"top\";\n  ctx.fillText(String(textValue), x, y);\n  ctx.restore();\n}\n\nfunction drawRTLText(g, textValue, x, y, baseline) {\n  drawCanvasText(g, textValue, x, y, {\n    direction: \"rtl\",\n    align: \"right\",\n    baseline: baseline || \"top\"\n  });\n}\n\nfunction drawLTRText(g, textValue, x, y, align, baseline) {\n  drawCanvasText(g, textValue, x, y, {\n    direction: \"ltr\",\n    align: align || \"left\",\n    baseline: baseline || \"top\"\n  });\n}\n\nfunction drawBilingualRTLText(g, hebrewText, arabicText, x, y, options) {\n  const opts = options || {};\n  const offset = opts.offset === undefined ? 1.5 : opts.offset;\n  const baseline = opts.baseline || \"top\";\n  const ctx = g.drawingContext;\n\n  ctx.save();\n  ctx.globalCompositeOperation = \"multiply\";\n\n  g.fill(HEBREW_TEXT_COLOR);\n  drawCanvasText(g, hebrewText, x + offset, y + offset * 0.58, {\n    direction: \"rtl\",\n    align: \"right\",\n    baseline\n  });\n\n  g.fill(ARABIC_TEXT_COLOR);\n  drawCanvasText(g, arabicText, x - offset, y - offset * 0.58, {\n    direction: \"rtl\",\n    align: \"right\",\n    baseline\n  });\n\n  ctx.restore();\n}\n\nfunction drawBilingualLines(g, hebrewLines, arabicLines, x, startY, lineHeight, offset) {\n  const ctx = g.drawingContext;\n  const shift = offset === undefined ? 1.5 : offset;\n\n  ctx.save();\n  ctx.globalCompositeOperation = \"multiply\";\n\n  g.fill(HEBREW_TEXT_COLOR);\n  for (let i = 0; i < hebrewLines.length; i++) {\n    drawRTLText(g, hebrewLines[i], x + shift, startY + i * lineHeight + shift * 0.58);\n  }\n\n  g.fill(ARABIC_TEXT_COLOR);\n  for (let i = 0; i < arabicLines.length; i++) {\n    drawRTLText(g, arabicLines[i], x - shift, startY + i * lineHeight - shift * 0.58);\n  }\n\n  ctx.restore();\n}\n\nfunction drawPatternOn(g, x, y, w, h, layout) {\n  const px = layout.patternX;\n  const py = layout.patternY;\n  const patternW = layout.patternW;\n  const patternH = layout.patternH;\n  const stripW = layout.singleStripW;\n  const stripGap = layout.patternGap;\n\n  // Two adjacent strips, each made from five exact square modules. Each module\n  // uses an 18 × 18 grid, so every colored unit remains a perfect square.\n  const medallionCount = PATTERN_BLOCK_COUNT;\n  const stripCount = PATTERN_STRIP_COUNT;\n  const cols = 18;\n  const rowsPerMedallion = 18;\n  const rows = rowsPerMedallion * medallionCount;\n  const halfCols = cols / 2;\n  const cell = stripW / cols;\n  const actualH = rows * cell;\n  const top = py + (patternH - actualH) * 0.5;\n  const medallionH = rowsPerMedallion;\n\n  const meaningLoss = answers[0];\n  const languageShift = answers[1];\n  const misreading = answers[2];\n  const belonging = answers[3];\n  const silence = answers[4];\n\n  const centerGap = Math.floor(mapValue(languageShift, 1, 5, 0, 2.2));\n  const missingCenterChance = mapValue(meaningLoss, 1, 5, 0.02, 0.42);\n  const pairDisplacementChance = mapValue(misreading, 1, 5, 0.01, 0.22);\n  const frameStrength = mapValue(belonging, 1, 5, 0.35, 0.95);\n  const silenceChance = mapValue(silence, 1, 5, 0.01, 0.25);\n\n  g.push();\n  g.noStroke();\n  g.fill(255);\n  g.rect(px, top, patternW, actualH);\n\n  for (let stripIndex = 0; stripIndex < stripCount; stripIndex++) {\n    const stripX = px + stripIndex * (stripW + stripGap);\n\n    for (let row = 0; row < rows; row++) {\n      const medallionIndex = Math.min(\n        medallionCount - 1,\n        Math.floor(row / rowsPerMedallion)\n      );\n\n      const localRow = row - medallionIndex * rowsPerMedallion;\n      const localCenterY = (medallionH - 1) * 0.5;\n      const normalizedY = Math.abs(localRow - localCenterY) / Math.max(1, localCenterY);\n\n      const motifVariant = Math.floor(\n        patternHash(201 + medallionIndex + stripIndex * 17, medallionIndex, stripIndex) * 4\n      );\n      const paletteFlip = patternHash(211 + stripIndex * 13, medallionIndex, userSeed) > 0.5;\n\n      for (let halfIndex = 0; halfIndex < halfCols; halfIndex++) {\n        const distanceFromCenter = halfCols - 1 - halfIndex;\n        if (distanceFromCenter < centerGap) continue;\n\n        const normalizedX = distanceFromCenter / Math.max(1, halfCols - 1);\n        const diamondDistance = normalizedX + normalizedY;\n        const innerDiamondDistance = normalizedX * 1.28 + normalizedY * 1.05;\n\n        const outerBandThickness = 0.075 + frameStrength * 0.035;\n        const onOuterDiamond = Math.abs(diamondDistance - 1.0) < outerBandThickness;\n        const onInnerDiamond = Math.abs(innerDiamondDistance - 0.58) < 0.075;\n\n        const centerGlyph =\n          distanceFromCenter <= 2 &&\n          Math.abs(localRow - localCenterY) <= 2.4 &&\n          ((distanceFromCenter + Math.round(localRow)) % 2 === motifVariant % 2);\n\n        const diagonalThreadA =\n          motifVariant === 0 &&\n          Math.abs(normalizedX - normalizedY * 0.72) < 0.08;\n\n        const diagonalThreadB =\n          motifVariant === 1 &&\n          Math.abs(normalizedX + normalizedY * 0.58 - 0.72) < 0.07;\n\n        const steppedThread =\n          motifVariant === 2 &&\n          ((distanceFromCenter + Math.floor(localRow)) % 4 === 0) &&\n          diamondDistance < 0.92;\n\n        const floatingMarks =\n          motifVariant === 3 &&\n          diamondDistance < 0.9 &&\n          patternHash(230 + medallionIndex + stripIndex * 19, distanceFromCenter, row) < 0.20;\n\n        let active =\n          onOuterDiamond ||\n          onInnerDiamond ||\n          centerGlyph ||\n          diagonalThreadA ||\n          diagonalThreadB ||\n          steppedThread ||\n          floatingMarks;\n\n        if (\n          !active &&\n          diamondDistance > 0.82 &&\n          diamondDistance < 1.05 &&\n          patternHash(240 + stripIndex * 7, distanceFromCenter, row) < frameStrength * 0.28\n        ) {\n          active = true;\n        }\n\n        if (!active) continue;\n\n        const centerProximity = 1 - Math.min(1, (normalizedX + normalizedY) * 0.78);\n        if (\n          centerProximity > 0.18 &&\n          patternHash(250 + stripIndex * 5, distanceFromCenter, row) < missingCenterChance * centerProximity\n        ) {\n          continue;\n        }\n\n        if (patternHash(260 + stripIndex * 11, distanceFromCenter, row) < silenceChance) continue;\n\n        let drawDistance = distanceFromCenter;\n        let drawRow = row;\n\n        if (patternHash(270 + stripIndex * 23, distanceFromCenter, row) < pairDisplacementChance) {\n          const verticalDirection =\n            patternHash(271 + stripIndex * 23, distanceFromCenter, row) < 0.5 ? -1 : 1;\n          drawRow += verticalDirection;\n\n          if (patternHash(272 + stripIndex * 23, distanceFromCenter, row) > 0.58) {\n            drawDistance += patternHash(273 + stripIndex * 23, distanceFromCenter, row) < 0.5 ? -1 : 1;\n          }\n        }\n\n        const moduleStartRow = medallionIndex * rowsPerMedallion;\n        const moduleEndRow = moduleStartRow + rowsPerMedallion - 1;\n\n        if (\n          drawDistance < centerGap ||\n          drawDistance >= halfCols ||\n          drawRow < moduleStartRow ||\n          drawRow > moduleEndRow\n        ) {\n          continue;\n        }\n\n        const leftCol = halfCols - 1 - drawDistance;\n        const rightCol = cols - 1 - leftCol;\n\n        const colorNoise = patternHash(\n          290 + medallionIndex + languageShift + stripIndex * 29,\n          distanceFromCenter,\n          row\n        );\n\n        let useRed = onOuterDiamond || centerGlyph;\n        if (paletteFlip) useRed = !useRed;\n        if (colorNoise > 0.72) useRed = !useRed;\n\n        g.fill(useRed ? RED : BLUE);\n\n        const inset = Math.max(1, cell * 0.12);\n        const squareSize = Math.max(1, cell - inset);\n        const drawY = top + drawRow * cell + inset * 0.5;\n\n        drawPatternCell(g, stripX, cell, leftCol, drawY, inset, squareSize);\n        drawPatternCell(g, stripX, cell, rightCol, drawY, inset, squareSize);\n      }\n    }\n  }\n\n  g.pop();\n}\n\nfunction drawPatternCell(g, patternX, cell, column, drawY, inset, squareSize) {\n  const drawX = patternX + column * cell + inset * 0.5;\n  const x1 = Math.round(drawX);\n  const y1 = Math.round(drawY);\n  const side = Math.max(1, Math.round(squareSize));\n  g.rect(x1, y1, side, side);\n}\n\nfunction patternHash(salt, a, b) {\n  const n = Math.sin(\n    salt * 93.173 +\n    a * 127.913 +\n    b * 311.719 +\n    patternSeed * 0.017 +\n    userSeed * 0.00031\n  ) * 43758.5453123;\n\n  return n - Math.floor(n);\n}\n\nfunction fitWrappedText(g, textValue, maxWidth, maxLines, startSize, minSize) {\n  let size = startSize;\n  let lines = [];\n\n  while (size >= minSize) {\n    g.textSize(size);\n    lines = wrapLines(g, textValue, maxWidth);\n    if (lines.length <= maxLines) break;\n    size -= 1;\n  }\n\n  return { size, lines };\n}\n\nfunction fitBilingualWrappedText(g, hebrewText, arabicText, maxWidth, maxLines, startSize, minSize) {\n  let size = startSize;\n  let hebrewLines = [];\n  let arabicLines = [];\n\n  while (size >= minSize) {\n    g.textSize(size);\n    hebrewLines = wrapLines(g, hebrewText, maxWidth);\n    arabicLines = wrapLines(g, arabicText, maxWidth);\n\n    if (hebrewLines.length <= maxLines && arabicLines.length <= maxLines) {\n      break;\n    }\n\n    size -= 1;\n  }\n\n  return { size, hebrewLines, arabicLines };\n}\n\nfunction drawMetricBlocks(g, x, y, activeCount, blockSize, gap) {\n  g.noStroke();\n\n  for (let i = 0; i < 5; i++) {\n    g.fill(i < activeCount ? ANSWER_BLOCK_COLOR : \"#d9d9d9\");\n    g.rect(x + i * (blockSize + gap), y, blockSize, blockSize);\n  }\n}\n\nfunction drawTicketBodyOn(g, x, y, w, h, layout) {\n  const he = CONTENT.he;\n  const ar = CONTENT.ar;\n  const textRight = layout.contentRight;\n  const contentW = layout.contentW;\n  const textOffset = Math.max(1.25, h * 0.00125);\n\n  g.push();\n  g.textFont(getTicketFont());\n  g.noStroke();\n\n  // Both languages are always present. Their overlap is rendered with multiply.\n  const noteY = y + h * 0.190;\n  g.textStyle(NORMAL);\n  g.textSize(h * 0.014);\n  drawBilingualRTLText(g, he.noteLabel, ar.noteLabel, textRight, noteY, {\n    offset: textOffset\n  });\n\n  const hebrewParagraph = getReflectionParagraph(\"he\");\n  const arabicParagraph = getReflectionParagraph(\"ar\");\n  const fitted = fitBilingualWrappedText(\n    g,\n    hebrewParagraph,\n    arabicParagraph,\n    contentW,\n    9,\n    h * 0.029,\n    h * 0.0225\n  );\n\n  g.textStyle(NORMAL);\n  g.textSize(fitted.size);\n  const paragraphLineH = fitted.size * 1.28;\n  const paragraphStartY = y + h * 0.210;\n  drawBilingualLines(\n    g,\n    fitted.hebrewLines,\n    fitted.arabicLines,\n    textRight,\n    paragraphStartY,\n    paragraphLineH,\n    textOffset\n  );\n\n  // Fixed row anchors preserve the exact vertical rhythm of the approved layout.\n  const rowStart = 0.490;\n  const rowEnd = 0.842;\n  const rowStep = (rowEnd - rowStart) / 4;\n  const rowAnchors = Array.from({ length: 5 }, function(_, index) {\n    return rowStart + index * rowStep;\n  });\n  const blockSize = h * 0.025;\n  const blockGap = h * 0.0095;\n  const blocksX = layout.contentX;\n  const blocksTotalW = blockSize * 5 + blockGap * 4;\n  const scoreToTextGap = w * 0.072;\n  const metricTextW = Math.max(\n    h * 0.16,\n    layout.contentRight - (blocksX + blocksTotalW + scoreToTextGap)\n  );\n\n  for (let i = 0; i < 5; i++) {\n    const rowY = y + h * rowAnchors[i];\n    const hebrewLabel = he.labels[i];\n    const arabicLabel = ar.labels[i];\n    const hebrewStatement = he.statements[i][answers[i] - 1];\n    const arabicStatement = ar.statements[i][answers[i] - 1];\n\n    drawMetricBlocks(\n      g,\n      blocksX,\n      rowY + h * 0.009,\n      answers[i],\n      blockSize,\n      blockGap\n    );\n\n    g.fill(92);\n    g.textSize(h * 0.0105);\n    g.textStyle(NORMAL);\n    drawLTRText(\n      g,\n      \"[\" + pad2(answers[i]) + \"]\",\n      blocksX,\n      rowY + blockSize + h * 0.014,\n      \"left\",\n      \"top\"\n    );\n\n    g.textStyle(BOLD);\n    g.textSize(h * 0.0212);\n    drawBilingualRTLText(\n      g,\n      hebrewLabel,\n      arabicLabel,\n      textRight,\n      rowY,\n      { offset: textOffset }\n    );\n\n    g.textStyle(NORMAL);\n    g.textSize(h * 0.0143);\n    const hebrewStatementLines = wrapLines(g, hebrewStatement, metricTextW).slice(0, 2);\n    const arabicStatementLines = wrapLines(g, arabicStatement, metricTextW).slice(0, 2);\n    drawBilingualLines(\n      g,\n      hebrewStatementLines,\n      arabicStatementLines,\n      textRight,\n      rowY + h * 0.0242,\n      h * 0.0182,\n      textOffset * 0.82\n    );\n  }\n\n  // The bilingual footer sits on the final baseline without competing with the readings.\n  const footerY = y + h * 0.952;\n  g.textStyle(NORMAL);\n  g.textSize(h * 0.0118);\n  const hebrewFooterLines = wrapLines(g, he.footerNote, contentW).slice(0, 1);\n  const arabicFooterLines = wrapLines(g, ar.footerNote, contentW).slice(0, 1);\n  drawBilingualLines(\n    g,\n    hebrewFooterLines,\n    arabicFooterLines,\n    textRight,\n    footerY,\n    h * 0.016,\n    textOffset * 0.75\n  );\n\n  g.pop();\n}\n\nfunction drawBarcodeOn(g, x, y, w, h, layout) {\n  // Kept as an empty hook. The approved landscape face has no barcode block;\n  // removing it prevents the lower-left area from becoming visually compressed.\n}\n\nfunction getReflectionParagraph(lang) {\n  const system = CONTENT[lang].reflectionSystem;\n  const average = answers.reduce((sum, value) => sum + value, 0) / answers.length;\n  const ranked = answers\n    .map((value, index) => ({ value, index }))\n    .sort((a, b) => b.value - a.value || a.index - b.index);\n\n  const topOne = ranked[0];\n  const topTwo = ranked[1];\n  const lowest = ranked.slice().sort((a, b) => a.value - b.value || a.index - b.index)[0];\n  const maximum = ranked[0].value;\n  const minimum = lowest.value;\n  const spread = maximum - minimum;\n\n  const openingBand = average <= 2.2 ? \"low\" : average >= 3.8 ? \"high\" : \"mid\";\n  const topOneBand = getReflectionScoreBand(topOne.value);\n  const topTwoBand = getReflectionScoreBand(topTwo.value);\n\n  const closingKey = spread >= 3 ? \"contrast\" : spread <= 1 ? \"even\" : \"balanced\";\n\n  const sentences = [\n    chooseReflectionText(system.opening[openingBand], 10),\n    chooseReflectionText(system.dimensions[topOne.index][topOneBand], 20 + topOne.index),\n    chooseReflectionText(system.dimensions[topTwo.index][topTwoBand], 30 + topTwo.index),\n    chooseReflectionText(system.closing[closingKey], 50)\n  ];\n\n  return sentences.filter(Boolean).join(\" \");\n}\n\nfunction getReflectionScoreBand(value) {\n  if (value <= 2) return \"low\";\n  if (value >= 4) return \"high\";\n  return \"mid\";\n}\n\nfunction chooseReflectionText(options, salt) {\n  if (!Array.isArray(options) || options.length === 0) return \"\";\n\n  const raw = Math.sin(\n    userSeed * 0.000127 +\n    patternSeed * 0.00173 +\n    salt * 41.771\n  ) * 43758.5453123;\n\n  const fraction = raw - Math.floor(raw);\n  const index = Math.min(options.length - 1, Math.floor(fraction * options.length));\n  return options[index];\n}\n\nfunction drawTextByLang(g, textValue, x, y) {\n  // Both Arabic and Hebrew are RTL languages.\n  drawRTLText(g, textValue, x, y);\n}\n\nfunction wrapLines(g, textValue, maxWidth) {\n  const words = String(textValue).trim().split(/\\s+/);\n  const lines = [];\n  const ctx = g.drawingContext;\n  let current = \"\";\n\n  ctx.save();\n  ctx.direction = \"rtl\";\n\n  for (let i = 0; i < words.length; i++) {\n    // Keep the logical word order. Native Canvas bidi rendering displays it RTL.\n    const test = current ? current + \" \" + words[i] : words[i];\n    if (ctx.measureText(test).width <= maxWidth || current === \"\") {\n      current = test;\n    } else {\n      lines.push(current);\n      current = words[i];\n    }\n  }\n\n  ctx.restore();\n  if (current) lines.push(current);\n  return lines;\n}\n\nfunction drawLines(g, lines, x, startY, lineHeight, direction) {\n  const useRTL = direction !== \"ltr\";\n  for (let i = 0; i < lines.length; i++) {\n    if (useRTL) {\n      drawRTLText(g, lines[i], x, startY + i * lineHeight);\n    } else {\n      drawLTRText(g, lines[i], x, startY + i * lineHeight, \"left\", \"top\");\n    }\n  }\n}\n\nfunction noiseHash(salt, a, b) {\n  const answerCode = answers[0] * 101 + answers[1] * 211 + answers[2] * 307 + answers[3] * 401 + answers[4] * 503 + patternSeed * 0.03;\n  const n = Math.sin(salt * 91.7 + a * 127.1 + b * 311.7 + answerCode) * 43758.5453123;\n  return n - Math.floor(n);\n}\n\nfunction mapValue(value, inMin, inMax, outMin, outMax) {\n  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));\n}\n\nfunction pad2(value) {\n  return String(value).padStart(2, \"0\");\n}\n</script>\n</body>\n</html>";

let reflectionTicketOpen = false;
let reflectionTicketOverlay = null;
let reflectionTicketFrame = null;
let reflectionPreviousBodyOverflow = "";

function ensureReflectionTicketOverlay() {
  if (reflectionTicketOverlay) return;

  reflectionTicketOverlay = document.createElement("section");
  reflectionTicketOverlay.id = "reflectionTicketOverlay";
  reflectionTicketOverlay.setAttribute("aria-label", "Reflection ticket");
  reflectionTicketOverlay.setAttribute("aria-hidden", "true");

  Object.assign(reflectionTicketOverlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "999999",
    display: "none",
    background: "#ececec",
    overflow: "hidden"
  });

  reflectionTicketFrame = document.createElement("iframe");
  reflectionTicketFrame.id = "reflectionTicketFrame";
  reflectionTicketFrame.title = "My Reflection Ticket";
  reflectionTicketFrame.srcdoc = REFLECTION_TICKET_EMBEDDED_HTML;
  reflectionTicketFrame.setAttribute("allow", "microphone; autoplay; clipboard-write");

  Object.assign(reflectionTicketFrame.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    border: "0",
    margin: "0",
    padding: "0",
    display: "block",
    background: "#ececec"
  });

  reflectionTicketFrame.addEventListener("load", function() {
    syncReflectionTicketFrameWithMainSketch();
  });

  reflectionTicketOverlay.appendChild(reflectionTicketFrame);
  document.body.appendChild(reflectionTicketOverlay);
}

function getReflectionFrameDocument() {
  if (!reflectionTicketFrame) return null;

  try {
    return reflectionTicketFrame.contentDocument ||
      (reflectionTicketFrame.contentWindow && reflectionTicketFrame.contentWindow.document) ||
      null;
  } catch (err) {
    console.warn("Could not access embedded reflection ticket:", err);
    return null;
  }
}

function syncReflectionTicketFrameWithMainSketch() {
  const doc = getReflectionFrameDocument();
  if (!doc) return;

  const foundCount = typeof getFoundPairCount === "function" ? getFoundPairCount() : 0;
  const totalCount = Array.isArray(coreWordPairs) ? coreWordPairs.length : 9;
  const countText = foundCount + "/" + totalCount;

  const foundNumber = doc.getElementById("foundNumber");
  if (foundNumber) {
    const layers = foundNumber.querySelectorAll("span");
    layers.forEach(function(layer) {
      layer.textContent = countText;
    });
  }

  const foundStatus = doc.getElementById("foundStatus");
  if (foundStatus) {
    foundStatus.setAttribute(
      "aria-label",
      foundCount + " מתוך " + totalCount + " נמצאו / تم العثور على " + foundCount + " من " + totalCount
    );
  }

  const nav = doc.getElementById("wordNavigation");
  if (nav) {
    const navWords = Array.from(nav.querySelectorAll(".navWord"));

    navWords.forEach(function(navWord) {
      const heLayer = navWord.querySelector(".hebrewLayer");
      const arLayer = navWord.querySelector(".arabicLayer");
      const hebrew = heLayer ? heLayer.textContent.trim() : "";
      const arabic = arLayer ? arLayer.textContent.trim() : "";
      const pair = coreWordPairs.find(function(item) {
        return item.hebrew === hebrew || item.arabic === arabic;
      });
      const isFound = pair && (hasFoundWord(pair.hebrew) || hasFoundWord(pair.arabic));

      navWord.style.display = isFound ? "grid" : "none";
      navWord.style.cursor = isFound ? "pointer" : "default";
      navWord.style.minHeight = "48px";
      navWord.style.alignItems = "center";
      navWord.style.justifyItems = "center";
      navWord.style.touchAction = "manipulation";

      if (!isFound || !pair) return;

      navWord.onclick = function(event) {
        event.preventDefault();
        event.stopPropagation();
        closeReflectionTicket();

        requestAnimationFrame(function() {
          if (typeof navigateToFoundPair === "function") {
            navigateToFoundPair(pair);
          }
        });
      };
    });
  }

  const projectTitle = doc.getElementById("projectTitle");
  if (projectTitle) {
    projectTitle.style.touchAction = "manipulation";
    projectTitle.onclick = function(event) {
      event.preventDefault();
      event.stopPropagation();
      closeReflectionTicket();
    };
  }
}

function openReflectionTicket() {
  ensureReflectionTicketOverlay();

  reflectionPreviousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  reflectionTicketOverlay.style.display = "block";
  reflectionTicketOverlay.setAttribute("aria-hidden", "false");
  reflectionTicketOpen = true;

  if (typeof currentSelection !== "undefined") {
    currentSelection = [];
  }

  if (typeof safePauseHomeVideo === "function") {
    safePauseHomeVideo();
  }

  // The frame may already be loaded from an earlier visit.
  requestAnimationFrame(syncReflectionTicketFrameWithMainSketch);
}

function closeReflectionTicket() {
  if (!reflectionTicketOverlay) return;

  reflectionTicketOverlay.style.display = "none";
  reflectionTicketOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = reflectionPreviousBodyOverflow;
  reflectionTicketOpen = false;

  if (typeof currentSelection !== "undefined") {
    currentSelection = [];
  }

  const mainCanvas = document.querySelector("body > canvas, canvas");
  if (mainCanvas && typeof mainCanvas.focus === "function") {
    mainCanvas.focus();
  }
}

function canOpenReflectionFromGrid() {
  if (reflectionTicketOpen) return false;

  if (
    typeof screenMode !== "undefined" &&
    screenMode === "intro" &&
    typeof transitionStarted !== "undefined" &&
    !transitionStarted
  ) {
    return false;
  }

  const blockingPopupIsOpen =
    (typeof homePopupOpen !== "undefined" && homePopupOpen) ||
    (typeof clothesPopupOpen !== "undefined" && clothesPopupOpen) ||
    (typeof memoryPopupOpen !== "undefined" && memoryPopupOpen) ||
    (typeof borderPopupOpen !== "undefined" && borderPopupOpen) ||
    (typeof belongingPopupOpen !== "undefined" && belongingPopupOpen) ||
    (typeof landPopupOpen !== "undefined" && landPopupOpen) ||
    (typeof blurPopupOpen !== "undefined" && blurPopupOpen);

  return !blockingPopupIsOpen;
}

(function installReflectionTicketTrigger() {
  const originalAddFoundWord = window.addFoundWord;

  if (typeof originalAddFoundWord === "function") {
    window.addFoundWord = function(cells, word) {
      const result = originalAddFoundWord.apply(this, arguments);

      if (
        typeof isReflectionWord === "function" &&
        isReflectionWord(word)
      ) {
        openReflectionTicket();
      }

      return result;
    };
  }

  const originalMousePressed = window.mousePressed;

  window.mousePressed = function() {
    if (reflectionTicketOpen) return false;

    if (
      canOpenReflectionFromGrid() &&
      typeof getFoundWordUnderMouse === "function" &&
      typeof isReflectionWord === "function"
    ) {
      const clickedFoundWord = getFoundWordUnderMouse();

      if (
        clickedFoundWord !== null &&
        isReflectionWord(clickedFoundWord.word)
      ) {
        openReflectionTicket();
        return false;
      }
    }

    if (typeof originalMousePressed === "function") {
      return originalMousePressed.apply(this, arguments);
    }

    return undefined;
  };

  const originalIsWordCurrentlyOpen = window.isWordCurrentlyOpen;

  if (typeof originalIsWordCurrentlyOpen === "function") {
    window.isWordCurrentlyOpen = function(word) {
      if (
        reflectionTicketOpen &&
        typeof isReflectionWord === "function" &&
        isReflectionWord(word)
      ) {
        return true;
      }

      return originalIsWordCurrentlyOpen.apply(this, arguments);
    };
  }

  document.addEventListener("keydown", function(event) {
    if (reflectionTicketOpen && event.key === "Escape") {
      event.preventDefault();
      closeReflectionTicket();
    }
  });

  window.openReflectionTicket = openReflectionTicket;
  window.closeReflectionTicket = closeReflectionTicket;
})();
// ================================================================
// BIRD SCREEN — exact reference composition
// ציפור מעופפת / عصفور طاير
//
// Keep bird.mp4 beside sketch.js.
// The resting layout is locked to the supplied 925 × 511 reference
// and scales proportionally on other touch-screen resolutions.
// Touching the bird repels nearby letters and starts the bilingual
// typewriter text. Dragging the full RTL prompt from right to left opens
// the word-search field.
// ================================================================

(function() {
  "use strict";

  var BIRD_CONFIG = {
    videoFiles: ["bird.mp4"],

    // Custom seamless video loop. The browser's native loop can briefly
    // expose an empty/fallback frame, which looked like a circular silhouette.
    // Restart slightly before the footage ends and preserve the last valid
    // sampled frame while the video seeks back to the beginning.
    loopStartSeconds: 0.04,
    loopEndTrimSeconds: 0.45,

    referenceWidth: 925,
    referenceHeight: 511,

    cols: 96,
    rows: 54,

    // Change to false when the bird is bright against a dark background.
    birdIsDark: true,
    cutoff: (255 - 174) / 255,
    contrast: 5,

    letterSwapMinMs: 900,
    letterSwapMaxMs: 3200,

    // Exact reference palette.
    background: "#eeeeee",
    cyan: "#2ef5ff",
    red: "#ff3535",
    ink: "#161616",
    white: "#ffffff",

    // Exact reference field, measured from the supplied 925 × 511 image.
    // Bird is 6% larger than the reference version, while keeping the
    // same visual center so the surrounding composition does not move.
    fieldX: 221,
    fieldY: 136,
    fieldWidth: 483,
    fieldHeight: 272,
    birdFontSize: 4.65,
    birdSplitX: 0.44,
    birdSplitY: 0.22,

    // Touch physics in reference-design pixels.
    // Enlarged touch field and stronger response for exhibition touch screens.
    touchRadius: 106,
    repulsionForce: 8.2,
    swipeForce: 12.4,
    returnSpring: 0.048,
    damping: 0.84,
    maxDisplacement: 76,

    // Bottom drag prompt measured from the reference.
    promptCenterX: 462.5,
    promptBaselineY: 464,
    promptFontSize: 9,
    promptHitWidth: 178,
    promptHitHeight: 42,

    // The bilingual statement appears only after the first touch and types
    // in from right to left. The prompt follows after the statement finishes.
    statementTypeDelayMs: 120,
    statementTypeCharsPerSecond: 25,
    statementLineGapMs: 150,
    promptTypeDelayMs: 260,
    promptTypeCharsPerSecond: 28,

    // The prompt is RTL, so the user must begin near its right edge and
    // slide almost all the way to its left edge before the field opens.
    promptStartZoneRatio: 0.24,
    promptCompletionRatio: 0.91,

    exitDurationMs: 680,
    idleResetMs: 90000
  };

  // Exact copy used in the supplied visual reference.
  var HEBREW_LINE_1 = "הזהות לעולם אינה מתגלה בשלמותה;";
  var HEBREW_LINE_2 = "היא מופיעה ברסיסים.";

  var ARABIC_LINE_1 = "الهوية لا توجــــد كــاملة أبداً";
  var ARABIC_LINE_2 = "بل تظهر في شظايا.";

  // Both language scripts occupy the same prompt position, producing
  // the same red/cyan registration seen in the reference image.
  var HEBREW_DRAG_PROMPT = "החליקו כדי להתחיל";
  var ARABIC_DRAG_PROMPT = "اسحبوا للبدء";

  var BIRD_HEBREW_LETTERS = Array.from("ציפורמעופפת");

  var BIRD_ARABIC_LETTERS = Array.from("عصفورطاير");

  var birdRoot = null;
  var birdCanvas = null;
  var birdCtx = null;
  var birdVideo = null;
  var birdSampler = null;
  var birdSamplerCtx = null;

  var birdCells = [];
  var birdVideoFailed = false;
  var birdSourceIndex = 0;
  var birdLastFrameAt = 0;
  var birdLastPhysicsAt = 0;
  var birdLastInteractionAt = 0;
  var birdExitingAt = -1;
  var birdHandedOver = false;
  var birdTextRevealStartedAt = -1;

  // Keep the last successfully sampled silhouette during video seeking.
  // This prevents the temporary fallback circle from flashing at the loop cut.
  var birdLastVideoPresence = null;
  var birdLoopSeeking = false;

  var birdPointer = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    previousTime: 0,
    velocityX: 0,
    velocityY: 0,
    promptDrag: false,
    dragStartX: 0,
    dragCurrentX: 0
  };

  function installBirdScreen() {
    if (typeof document === "undefined") return;
    if (document.getElementById("pagmar-bird-screen")) return;

    installBirdStyles();

    birdRoot = document.createElement("div");
    birdRoot.id = "pagmar-bird-screen";
    birdRoot.setAttribute("role", "application");
    birdRoot.setAttribute(
      "aria-label",
      "Interactive flying bird made from letters. Drag the lower instruction to enter."
    );

    birdCanvas = document.createElement("canvas");
    birdCanvas.setAttribute("aria-hidden", "true");
    birdCtx = birdCanvas.getContext("2d", { alpha: false });

    birdVideo = document.createElement("video");
    birdVideo.muted = true;
    birdVideo.loop = false;
    birdVideo.autoplay = true;
    birdVideo.playsInline = true;
    birdVideo.preload = "auto";
    birdVideo.setAttribute("muted", "");
    birdVideo.removeAttribute("loop");
    birdVideo.setAttribute("autoplay", "");
    birdVideo.setAttribute("playsinline", "");
    birdVideo.setAttribute("webkit-playsinline", "");
    birdVideo.addEventListener("error", tryNextBirdSource);
    birdVideo.addEventListener("timeupdate", keepBirdVideoLooping);
    birdVideo.addEventListener("ended", restartBirdVideoLoop);
    birdVideo.addEventListener("seeked", function() {
      birdLoopSeeking = false;
      playBirdVideo();
    });
    birdVideo.addEventListener("loadedmetadata", function() {
      restartBirdVideoLoop();
    });
    birdVideo.src = BIRD_CONFIG.videoFiles[0];

    birdRoot.appendChild(birdVideo);
    birdRoot.appendChild(birdCanvas);
    document.body.appendChild(birdRoot);

    birdSampler = document.createElement("canvas");
    birdSampler.width = BIRD_CONFIG.cols;
    birdSampler.height = BIRD_CONFIG.rows;
    birdSamplerCtx = birdSampler.getContext("2d", { willReadFrequently: true });

    buildBirdCells();
    resizeBirdCanvas();

    window.addEventListener("resize", resizeBirdCanvas);

    birdRoot.addEventListener("pointerdown", birdPointerDown, { passive: false });
    birdRoot.addEventListener("pointermove", birdPointerMove, { passive: false });
    birdRoot.addEventListener("pointerup", birdPointerUp, { passive: false });
    birdRoot.addEventListener("pointercancel", birdPointerUp, { passive: false });

    birdRoot.addEventListener("keydown", function(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        requestBirdExit();
      }
    });

    birdRoot.tabIndex = 0;

    birdLastInteractionAt = birdNow();
    birdLastPhysicsAt = birdLastInteractionAt;

    // Force the requested typeface into the browser font cache before
    // the first important frame. Rendering continues while it loads.
    if (document.fonts && typeof document.fonts.load === "function") {
      document.fonts.load('12px "SimplerPro_HLAR_Mono"').catch(function() {});
    }

    playBirdVideo();
    watchBirdIdle();
    requestAnimationFrame(birdFrame);
  }

  function installBirdStyles() {
    var style = document.createElement("style");
    style.id = "pagmar-bird-screen-style";
    style.textContent =
      '#pagmar-bird-screen {' +
      '  position: fixed;' +
      '  inset: 0;' +
      '  z-index: 99999;' +
      '  overflow: hidden;' +
      '  background: #eeeeee;' +
      '  cursor: crosshair;' +
      '  touch-action: none;' +
      '  -webkit-tap-highlight-color: transparent;' +
      '  user-select: none;' +
      '  -webkit-user-select: none;' +
      '  transition: opacity ' + BIRD_CONFIG.exitDurationMs + 'ms linear;' +
      '}' +
      '#pagmar-bird-screen.is-leaving { opacity: 0; }' +
      '#pagmar-bird-screen canvas {' +
      '  display: block;' +
      '  width: 100%;' +
      '  height: 100%;' +
      '}' +
      '#pagmar-bird-screen video {' +
      '  position: absolute;' +
      '  left: -20px;' +
      '  top: -20px;' +
      '  width: 2px;' +
      '  height: 2px;' +
      '  opacity: 0;' +
      '  pointer-events: none;' +
      '}';

    document.head.appendChild(style);
  }

  function tryNextBirdSource() {
    birdSourceIndex++;

    if (birdSourceIndex >= BIRD_CONFIG.videoFiles.length) {
      birdVideoFailed = true;
      console.log("MISSING FILE: bird.mp4. Using the built-in letter silhouette.");
      return;
    }

    birdLastVideoPresence = null;
    birdLoopSeeking = false;
    birdVideo.src = BIRD_CONFIG.videoFiles[birdSourceIndex];
    playBirdVideo();
  }

  function playBirdVideo() {
    if (!birdVideo) return;

    try {
      var promise = birdVideo.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function() {});
      }
    } catch (error) {}
  }

  function setBirdPlaybackRate(rate) {
    if (!birdVideo) return;

    try {
      birdVideo.playbackRate = rate;
    } catch (error) {}
  }

  function getBirdLoopStartTime() {
    if (!birdVideo || !Number.isFinite(birdVideo.duration)) return 0;

    return clampBird(
      BIRD_CONFIG.loopStartSeconds,
      0,
      Math.max(0, birdVideo.duration - 0.05)
    );
  }

  function getBirdLoopEndTime() {
    if (!birdVideo || !Number.isFinite(birdVideo.duration)) return Infinity;

    var start = getBirdLoopStartTime();

    return Math.max(
      start + 0.08,
      birdVideo.duration - BIRD_CONFIG.loopEndTrimSeconds
    );
  }

  function keepBirdVideoLooping() {
    if (!birdVideo || birdVideoFailed || birdLoopSeeking) return;
    if (!Number.isFinite(birdVideo.duration) || birdVideo.duration <= 0) return;

    if (birdVideo.currentTime >= getBirdLoopEndTime()) {
      restartBirdVideoLoop();
    }
  }

  function restartBirdVideoLoop() {
    if (!birdVideo || birdVideoFailed) return;
    if (!Number.isFinite(birdVideo.duration) || birdVideo.duration <= 0) return;
    if (birdLoopSeeking) return;

    birdLoopSeeking = true;

    try {
      birdVideo.currentTime = getBirdLoopStartTime();
    } catch (error) {
      birdLoopSeeking = false;
      playBirdVideo();
    }
  }

  function buildBirdCells() {
    birdCells = [];
    var now = birdNow();

    for (var i = 0; i < BIRD_CONFIG.cols * BIRD_CONFIG.rows; i++) {
      birdCells.push({
        hebrew: pickBird(BIRD_HEBREW_LETTERS),
        arabic: pickBird(BIRD_ARABIC_LETTERS),
        swapAt: now + birdRandom(0, BIRD_CONFIG.letterSwapMaxMs),
        offsetX: 0,
        offsetY: 0,
        velocityX: 0,
        velocityY: 0,
        drift: Math.random()
      });
    }
  }

  function resizeBirdCanvas() {
    if (!birdCanvas || !birdCtx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    birdCanvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
    birdCanvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
    birdCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    birdCtx.imageSmoothingEnabled = true;
  }

  function getReferenceTransform() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    var scale = Math.min(
      width / BIRD_CONFIG.referenceWidth,
      height / BIRD_CONFIG.referenceHeight
    );

    return {
      scale: scale,
      offsetX: (width - BIRD_CONFIG.referenceWidth * scale) / 2,
      offsetY: (height - BIRD_CONFIG.referenceHeight * scale) / 2
    };
  }

  function screenPointToReference(clientX, clientY) {
    var transform = getReferenceTransform();

    return {
      x: (clientX - transform.offsetX) / transform.scale,
      y: (clientY - transform.offsetY) / transform.scale
    };
  }

  function birdPointerDown(event) {
    if (birdExitingAt >= 0) return;

    event.preventDefault();
    event.stopPropagation();

    updateBirdPointer(event, true);
    birdPointer.down = true;
    birdPointer.id = event.pointerId;
    birdLastInteractionAt = birdNow();

    var textWasHidden = birdTextRevealStartedAt < 0;

    if (textWasHidden) {
      birdTextRevealStartedAt = birdLastInteractionAt;
    }

    try {
      birdRoot.setPointerCapture(event.pointerId);
    } catch (error) {}

    var prompt = getPromptHitRect();
    var promptReady = isBirdPromptReady(birdLastInteractionAt);
    var promptStartX =
      prompt.x + prompt.width * (1 - BIRD_CONFIG.promptStartZoneRatio);

    // The first touch only reveals the typewriter text. Once the prompt has
    // finished typing, entry can begin only from the sentence's RTL start
    // zone at the right edge.
    if (
      !textWasHidden &&
      promptReady &&
      pointInsideRect(birdPointer.x, birdPointer.y, prompt) &&
      birdPointer.x >= promptStartX
    ) {
      birdPointer.promptDrag = true;
      birdPointer.dragStartX = prompt.x + prompt.width;
      birdPointer.dragCurrentX = birdPointer.x;
      setBirdPlaybackRate(0.22);
    } else {
      birdPointer.promptDrag = false;
      setBirdPlaybackRate(0.22);
    }
  }

  function birdPointerMove(event) {
    if (!birdPointer.down) return;
    if (birdPointer.id !== null && event.pointerId !== birdPointer.id) return;

    event.preventDefault();
    event.stopPropagation();

    updateBirdPointer(event, false);
    birdLastInteractionAt = birdNow();

    if (birdPointer.promptDrag) {
      var prompt = getPromptHitRect();
      birdPointer.dragCurrentX = clampBird(
        birdPointer.x,
        prompt.x,
        prompt.x + prompt.width
      );

      // RTL sentence: progress begins on the right and increases only while
      // sliding toward the left. Reversing direction never counts as entry.
      if (getPromptDragProgress() >= BIRD_CONFIG.promptCompletionRatio) {
        requestBirdExit();
      }
    }
  }

  function birdPointerUp(event) {
    if (!birdPointer.down) return;
    if (birdPointer.id !== null && event.pointerId !== birdPointer.id) return;

    event.preventDefault();
    event.stopPropagation();

    updateBirdPointer(event, false);

    birdPointer.down = false;
    birdPointer.id = null;
    birdPointer.promptDrag = false;
    birdPointer.velocityX *= 0.35;
    birdPointer.velocityY *= 0.35;

    setBirdPlaybackRate(1);

    try {
      birdRoot.releasePointerCapture(event.pointerId);
    } catch (error) {}
  }

  function updateBirdPointer(event, resetVelocity) {
    var now = birdNow();
    var point = screenPointToReference(event.clientX, event.clientY);

    if (resetVelocity || birdPointer.previousTime <= 0) {
      birdPointer.velocityX = 0;
      birdPointer.velocityY = 0;
    } else {
      var elapsed = Math.max(8, now - birdPointer.previousTime);
      birdPointer.velocityX = clampBird(
        (point.x - birdPointer.previousX) / elapsed,
        -3.2,
        3.2
      );
      birdPointer.velocityY = clampBird(
        (point.y - birdPointer.previousY) / elapsed,
        -3.2,
        3.2
      );
    }

    birdPointer.previousX = point.x;
    birdPointer.previousY = point.y;
    birdPointer.previousTime = now;
    birdPointer.x = point.x;
    birdPointer.y = point.y;
  }

  function birdFrame() {
    if (!birdRoot || birdRoot.style.display === "none") return;

    keepBirdVideoLooping();

    var now = birdNow();

    if (now - birdLastFrameAt >= 32) {
      birdLastFrameAt = now;
      renderBird(now);
    }

    if (
      birdExitingAt >= 0 &&
      now - birdExitingAt > BIRD_CONFIG.exitDurationMs
    ) {
      finishBirdExit();
      return;
    }

    requestAnimationFrame(birdFrame);
  }

  function renderBird(now) {
    var width = window.innerWidth;
    var height = window.innerHeight;
    var transform = getReferenceTransform();
    var dt = clampBird((now - birdLastPhysicsAt) / 16.667, 0.4, 2.5);
    birdLastPhysicsAt = now;

    birdCtx.setTransform(1, 0, 0, 1, 0, 0);

    // Account for the high-resolution backing canvas.
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    birdCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    birdCtx.fillStyle = BIRD_CONFIG.background;
    birdCtx.fillRect(0, 0, width, height);

    birdCtx.save();
    birdCtx.translate(transform.offsetX, transform.offsetY);
    birdCtx.scale(transform.scale, transform.scale);

    drawReferenceBird(now, dt);

    if (birdTextRevealStartedAt >= 0) {
      drawReferenceTextBlocks(now);
      drawReferencePrompt(now);

      if (birdPointer.down && birdPointer.promptDrag) {
        drawPromptDragCapsule(now);
      }
    }

    birdCtx.restore();
  }

  function drawReferenceBird(now, dt) {
    var data = sampleBirdVideo();
    var stepX = BIRD_CONFIG.fieldWidth / BIRD_CONFIG.cols;
    var stepY = BIRD_CONFIG.fieldHeight / BIRD_CONFIG.rows;

    birdCtx.save();
    birdCtx.textAlign = "center";
    birdCtx.textBaseline = "middle";
    birdCtx.direction = "rtl";
    birdCtx.font =
      BIRD_CONFIG.birdFontSize +
      'px "SimplerPro_HLAR_Mono", monospace';
    birdCtx.globalCompositeOperation = "source-over";

    for (var row = 0; row < BIRD_CONFIG.rows; row++) {
      for (var col = 0; col < BIRD_CONFIG.cols; col++) {
        var index = row * BIRD_CONFIG.cols + col;
        var item = birdCells[index];
        // Use the fallback only when the video genuinely failed. While the
        // video is loading or seeking during the loop, show no substitute
        // silhouette (the cached frame is normally returned by sampleBirdVideo).
        var presence = data
          ? data[index]
          : birdVideoFailed
          ? birdFallbackPresence(col, row, now)
          : 0;

        var baseX = BIRD_CONFIG.fieldX + col * stepX + stepX / 2;
        var baseY = BIRD_CONFIG.fieldY + row * stepY + stepY / 2;

        updateBirdCellPhysics(item, baseX, baseY, dt);

        if (presence <= 0.015) continue;

        if (now >= item.swapAt) {
          item.hebrew = pickBird(BIRD_HEBREW_LETTERS);
          item.arabic = pickBird(BIRD_ARABIC_LETTERS);
          item.swapAt = now + birdRandom(
            BIRD_CONFIG.letterSwapMinMs,
            BIRD_CONFIG.letterSwapMaxMs
          );
        }

        var x = baseX + item.offsetX;
        var y = baseY + item.offsetY;
        var alpha = clampBird(presence * 0.92, 0, 0.92);

        birdCtx.globalAlpha = alpha;
        birdCtx.fillStyle = BIRD_CONFIG.ink;
        birdCtx.fillText(
          item.hebrew,
          x + BIRD_CONFIG.birdSplitX,
          y + BIRD_CONFIG.birdSplitY
        );

        birdCtx.globalAlpha = alpha * 0.74;
        birdCtx.fillText(
          item.arabic,
          x - BIRD_CONFIG.birdSplitX,
          y - BIRD_CONFIG.birdSplitY
        );
      }
    }

    birdCtx.globalAlpha = 1;
    birdCtx.restore();
  }

  function updateBirdCellPhysics(item, baseX, baseY, dt) {
    if (birdPointer.down && !birdPointer.promptDrag) {
      var dx = baseX + item.offsetX - birdPointer.x;
      var dy = baseY + item.offsetY - birdPointer.y;
      var distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < BIRD_CONFIG.touchRadius) {
        var safeDistance = Math.max(0.001, distance);
        var pressure = 1 - distance / BIRD_CONFIG.touchRadius;
        // Softer exponent makes the outer part of the touch radius react too,
        // which is important for broad finger contact on a touch screen.
        pressure = Math.pow(pressure, 1.45);

        item.velocityX +=
          (dx / safeDistance) * BIRD_CONFIG.repulsionForce * pressure * dt +
          birdPointer.velocityX * BIRD_CONFIG.swipeForce * pressure;

        item.velocityY +=
          (dy / safeDistance) * BIRD_CONFIG.repulsionForce * pressure * dt +
          birdPointer.velocityY * BIRD_CONFIG.swipeForce * pressure;
      }
    }

    item.velocityX += -item.offsetX * BIRD_CONFIG.returnSpring * dt;
    item.velocityY += -item.offsetY * BIRD_CONFIG.returnSpring * dt;

    var damping = Math.pow(BIRD_CONFIG.damping, dt);
    item.velocityX *= damping;
    item.velocityY *= damping;

    item.offsetX += item.velocityX * dt;
    item.offsetY += item.velocityY * dt;

    var displacement = Math.sqrt(
      item.offsetX * item.offsetX + item.offsetY * item.offsetY
    );

    if (displacement > BIRD_CONFIG.maxDisplacement) {
      var scale = BIRD_CONFIG.maxDisplacement / displacement;
      item.offsetX *= scale;
      item.offsetY *= scale;
      item.velocityX *= 0.7;
      item.velocityY *= 0.7;
    }
  }

  function sampleBirdVideo() {
    if (birdVideoFailed) return null;
    if (!birdVideo) return birdLastVideoPresence;

    keepBirdVideoLooping();

    // During the seek back to the loop start, reuse the previous valid
    // silhouette instead of drawing the fallback circle or a cut final frame.
    if (birdVideo.readyState < 2 || birdVideo.seeking || birdLoopSeeking) {
      return birdLastVideoPresence;
    }

    try {
      birdSamplerCtx.drawImage(
        birdVideo,
        0,
        0,
        BIRD_CONFIG.cols,
        BIRD_CONFIG.rows
      );
    } catch (error) {
      return birdLastVideoPresence;
    }

    var pixels;

    try {
      pixels = birdSamplerCtx.getImageData(
        0,
        0,
        BIRD_CONFIG.cols,
        BIRD_CONFIG.rows
      ).data;
    } catch (error) {
      birdVideoFailed = true;
      console.log(
        "Bird screen: video pixels could not be read. Use Live Server, not file://."
      );
      return null;
    }

    var output = new Float32Array(BIRD_CONFIG.cols * BIRD_CONFIG.rows);

    for (var i = 0; i < output.length; i++) {
      var pixel = i * 4;
      var luminance =
        (0.2126 * pixels[pixel] +
          0.7152 * pixels[pixel + 1] +
          0.0722 * pixels[pixel + 2]) /
        255;

      var value = BIRD_CONFIG.birdIsDark ? 1 - luminance : luminance;
      value =
        (value - BIRD_CONFIG.cutoff) /
        Math.max(0.001, 1 - BIRD_CONFIG.cutoff);
      value = clampBird(value, 0, 1);
      output[i] = Math.pow(value, BIRD_CONFIG.contrast);
    }

    birdLastVideoPresence = output;
    return output;
  }

  function birdFallbackPresence(col, row, now) {
    var x = (col - BIRD_CONFIG.cols * 0.5) / (BIRD_CONFIG.cols * 0.43);
    var y = (row - BIRD_CONFIG.rows * 0.47) / (BIRD_CONFIG.rows * 0.24);
    var body = 1 - Math.sqrt(x * x + y * y);
    var wing = Math.sin(col * 0.15 + now * 0.0012) * 0.14;
    return Math.max(0, body + wing);
  }

  function splitBirdText(textValue) {
    if (
      typeof Intl !== "undefined" &&
      typeof Intl.Segmenter === "function"
    ) {
      var segmenter = new Intl.Segmenter("ar", {
        granularity: "grapheme"
      });

      return Array.from(segmenter.segment(textValue), function(part) {
        return part.segment;
      });
    }

    return Array.from(textValue);
  }

  function getTypedBirdText(textValue, visibleCount) {
    return splitBirdText(textValue)
      .slice(0, Math.max(0, Math.floor(visibleCount)))
      .join("");
  }

  function getBirdTypingState(now) {
    if (birdTextRevealStartedAt < 0) {
      return {
        hebrewLine1: 0,
        arabicLine1: 0,
        hebrewLine2: 0,
        arabicLine2: 0,
        hebrewPrompt: 0,
        arabicPrompt: 0,
        promptReady: false
      };
    }

    var elapsed =
      now -
      birdTextRevealStartedAt -
      BIRD_CONFIG.statementTypeDelayMs;

    var h1Length = splitBirdText(HEBREW_LINE_1).length;
    var a1Length = splitBirdText(ARABIC_LINE_1).length;
    var firstLineLength = Math.max(h1Length, a1Length);
    var firstLineDuration =
      (firstLineLength / BIRD_CONFIG.statementTypeCharsPerSecond) * 1000;

    var secondLineStart =
      firstLineDuration + BIRD_CONFIG.statementLineGapMs;

    var h2Length = splitBirdText(HEBREW_LINE_2).length;
    var a2Length = splitBirdText(ARABIC_LINE_2).length;
    var secondLineLength = Math.max(h2Length, a2Length);
    var secondLineDuration =
      (secondLineLength / BIRD_CONFIG.statementTypeCharsPerSecond) * 1000;

    var promptStart =
      secondLineStart +
      secondLineDuration +
      BIRD_CONFIG.promptTypeDelayMs;

    var hPromptLength = splitBirdText(HEBREW_DRAG_PROMPT).length;
    var aPromptLength = splitBirdText(ARABIC_DRAG_PROMPT).length;
    var promptLength = Math.max(hPromptLength, aPromptLength);
    var promptDuration =
      (promptLength / BIRD_CONFIG.promptTypeCharsPerSecond) * 1000;

    var firstVisible = Math.max(
      0,
      (elapsed / 1000) * BIRD_CONFIG.statementTypeCharsPerSecond
    );

    var secondVisible = Math.max(
      0,
      ((elapsed - secondLineStart) / 1000) *
        BIRD_CONFIG.statementTypeCharsPerSecond
    );

    var promptVisible = Math.max(
      0,
      ((elapsed - promptStart) / 1000) *
        BIRD_CONFIG.promptTypeCharsPerSecond
    );

    return {
      hebrewLine1: Math.min(h1Length, firstVisible),
      arabicLine1: Math.min(a1Length, firstVisible),
      hebrewLine2: Math.min(h2Length, secondVisible),
      arabicLine2: Math.min(a2Length, secondVisible),
      hebrewPrompt: Math.min(hPromptLength, promptVisible),
      arabicPrompt: Math.min(aPromptLength, promptVisible),
      promptReady: elapsed >= promptStart + promptDuration
    };
  }

  function isBirdPromptReady(now) {
    return getBirdTypingState(now).promptReady;
  }

  function drawReferenceTextBlocks(now) {
    var typing = getBirdTypingState(now);

    birdCtx.save();
    birdCtx.textBaseline = "middle";
    birdCtx.font = '11px "SimplerPro_HLAR_Mono", monospace';

    drawReferenceTypedLine({
      text: HEBREW_LINE_1,
      visibleCount: typing.hebrewLine1,
      x: 655,
      y: 57,
      width: 215,
      height: 16,
      background: BIRD_CONFIG.cyan,
      foreground: BIRD_CONFIG.ink,
      direction: "rtl",
      align: "right",
      textX: 865
    });

    drawReferenceTypedLine({
      text: HEBREW_LINE_2,
      visibleCount: typing.hebrewLine2,
      x: 630,
      y: 74,
      width: 129,
      height: 16,
      background: BIRD_CONFIG.cyan,
      foreground: BIRD_CONFIG.ink,
      direction: "rtl",
      align: "right",
      textX: 755
    });

    drawReferenceTypedLine({
      text: ARABIC_LINE_1,
      visibleCount: typing.arabicLine1,
      x: 132,
      y: 379,
      width: 210,
      height: 16,
      background: BIRD_CONFIG.red,
      foreground: BIRD_CONFIG.white,
      direction: "rtl",
      align: "right",
      textX: 338
    });

    drawReferenceTypedLine({
      text: ARABIC_LINE_2,
      visibleCount: typing.arabicLine2,
      x: 109,
      y: 395,
      width: 122,
      height: 16,
      background: BIRD_CONFIG.red,
      foreground: BIRD_CONFIG.white,
      direction: "rtl",
      align: "right",
      textX: 227
    });

    birdCtx.restore();
  }

  function drawReferenceTypedLine(options) {
    var visibleText = getTypedBirdText(
      options.text,
      options.visibleCount
    );

    if (!visibleText) return;

    birdCtx.save();
    birdCtx.direction = options.direction;
    birdCtx.textAlign = options.align;

    var fullRight = options.x + options.width;
    var rightPadding = Math.max(3, fullRight - options.textX);
    var leftPadding = 5;
    var measuredWidth = birdCtx.measureText(visibleText).width;
    var visibleWidth = Math.min(
      options.width,
      measuredWidth + leftPadding + rightPadding
    );
    var visibleX = fullRight - visibleWidth;

    // The colored strip grows from the RTL starting edge as the characters
    // type in, instead of appearing as a complete block immediately.
    birdCtx.fillStyle = options.background;
    birdCtx.fillRect(
      visibleX,
      options.y,
      visibleWidth,
      options.height
    );

    birdCtx.beginPath();
    birdCtx.rect(
      visibleX,
      options.y,
      visibleWidth,
      options.height
    );
    birdCtx.clip();

    birdCtx.fillStyle = options.foreground;
    birdCtx.fillText(
      visibleText,
      options.textX,
      options.y + options.height / 2 + 0.4
    );

    birdCtx.restore();
  }

  function getPromptDragProgress() {
    if (!birdPointer.promptDrag) return 0;

    var prompt = getPromptHitRect();
    var right = prompt.x + prompt.width;

    return clampBird(
      (right - birdPointer.dragCurrentX) / prompt.width,
      0,
      1
    );
  }

  function drawReferencePrompt(now) {
    var typing = getBirdTypingState(now);
    var hebrewPrompt = getTypedBirdText(
      HEBREW_DRAG_PROMPT,
      typing.hebrewPrompt
    );
    var arabicPrompt = getTypedBirdText(
      ARABIC_DRAG_PROMPT,
      typing.arabicPrompt
    );

    if (!hebrewPrompt && !arabicPrompt) return;

    birdCtx.save();
    birdCtx.textAlign = "center";
    birdCtx.textBaseline = "alphabetic";
    birdCtx.direction = "rtl";
    birdCtx.font =
      BIRD_CONFIG.promptFontSize +
      'px "SimplerPro_HLAR_Mono", monospace';
    birdCtx.globalCompositeOperation = "multiply";

    if (hebrewPrompt) {
      birdCtx.fillStyle = BIRD_CONFIG.cyan;
      birdCtx.fillText(
        hebrewPrompt,
        BIRD_CONFIG.promptCenterX + 1.15,
        BIRD_CONFIG.promptBaselineY + 0.55
      );
    }

    if (arabicPrompt) {
      birdCtx.fillStyle = BIRD_CONFIG.red;
      birdCtx.fillText(
        arabicPrompt,
        BIRD_CONFIG.promptCenterX - 1.15,
        BIRD_CONFIG.promptBaselineY - 0.55
      );
    }

    birdCtx.restore();
  }

  function getPromptHitRect() {
    return {
      x: BIRD_CONFIG.promptCenterX - BIRD_CONFIG.promptHitWidth / 2,
      y: BIRD_CONFIG.promptBaselineY - BIRD_CONFIG.promptHitHeight / 2 - 4,
      width: BIRD_CONFIG.promptHitWidth,
      height: BIRD_CONFIG.promptHitHeight
    };
  }

  function drawPromptDragCapsule(now) {
    // Match the word-field selection exactly: the capsule is visible only
    // while the user is actively dragging, with the same padding, dash
    // proportions, rounded ends, black stroke and full opacity.
    if (!isBirdPromptReady(now) || !birdPointer.promptDrag) return;

    var progress = getPromptDragProgress();
    var fieldScale = BIRD_CONFIG.promptFontSize / 5.5;

    var sidePadding = 7.45 * 0.52 * fieldScale;
    var topBottomPadding = 9.35 * 0.36 * fieldScale;
    var dashLength = 4.6 * fieldScale;
    var dashGap = 4.2 * fieldScale;
    var lineWeight = 0.42 * fieldScale;

    birdCtx.save();
    birdCtx.font =
      BIRD_CONFIG.promptFontSize +
      'px "SimplerPro_HLAR_Mono", monospace';

    var fullTextWidth = Math.max(
      birdCtx.measureText(HEBREW_DRAG_PROMPT).width,
      birdCtx.measureText(ARABIC_DRAG_PROMPT).width
    );

    var rightCenter = BIRD_CONFIG.promptCenterX + fullTextWidth / 2;
    var selectedCenterSpan = Math.max(
      BIRD_CONFIG.promptFontSize * 0.5,
      fullTextWidth * progress
    );

    var boxX = rightCenter - selectedCenterSpan - sidePadding;
    var boxW = selectedCenterSpan + sidePadding * 2;
    var boxH = topBottomPadding * 2;
    var textCenterY =
      BIRD_CONFIG.promptBaselineY - BIRD_CONFIG.promptFontSize * 0.34;
    var boxY = textCenterY - boxH / 2;
    var radius = boxH / 2;

    birdCtx.globalAlpha = 1;
    birdCtx.strokeStyle = "rgb(0,0,0)";
    birdCtx.lineWidth = lineWeight;
    birdCtx.setLineDash([dashLength, dashGap]);
    birdCtx.lineDashOffset = 0;
    birdCtx.lineJoin = "round";
    birdCtx.lineCap = "round";

    birdCtx.beginPath();
    roundedBirdRectPath(
      birdCtx,
      boxX,
      boxY,
      boxW,
      boxH,
      radius
    );
    birdCtx.stroke();
    birdCtx.restore();
  }

  function roundedBirdRectPath(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);

    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - r,
      y + height
    );
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function requestBirdExit() {
    if (birdExitingAt >= 0) return;

    birdExitingAt = birdNow();
    birdRoot.classList.add("is-leaving");
  }

  function finishBirdExit() {
    if (birdHandedOver) return;
    birdHandedOver = true;

    try {
      birdVideo.pause();
    } catch (error) {}

    birdRoot.style.display = "none";
    handOverToWordField();
  }

  function handOverToWordField() {
    try {
      if (typeof screenMode !== "undefined") screenMode = "game";
      if (typeof transition !== "undefined") transition = 1;
      if (typeof transitionStarted !== "undefined") transitionStarted = true;
      if (typeof gridRevealStartTime !== "undefined") gridRevealStartTime = -1;
      if (typeof beginGridReveal === "function") beginGridReveal();
    } catch (error) {
      console.log("Bird screen could not hand over to the grid:", error);
    }
  }

  function watchBirdIdle() {
    if (!BIRD_CONFIG.idleResetMs) return;

    ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"].forEach(
      function(eventName) {
        window.addEventListener(
          eventName,
          function() {
            birdLastInteractionAt = birdNow();
          },
          { passive: true }
        );
      }
    );

    setInterval(function() {
      if (!birdHandedOver) return;
      if (birdNow() - birdLastInteractionAt < BIRD_CONFIG.idleResetMs) return;
      window.location.reload();
    }, 5000);
  }

  function pointInsideRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  function clampBird(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function birdNow() {
    return typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  }

  function pickBird(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function birdRandom(minimum, maximum) {
    return minimum + Math.random() * (maximum - minimum);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installBirdScreen);
  } else {
    installBirdScreen();
  }
})();
