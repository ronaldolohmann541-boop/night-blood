"use strict";


/*
============================================================
NIGHT BLOOD 0.14
TEN VISUAL PASSES

01 Composition
02 Gothic skyline
03 Brooklyn bridge
04 Architecture / Nocturne
05 Wet street / lighting
06 Hero sprite redesign
07 Frame-based animation system
08 Enemy attack animation
09 Combat VFX
10 Cinematic HUD / polish
============================================================
*/


const canvas =
    document.getElementById("game");

const ctx =
    canvas.getContext("2d");


ctx.imageSmoothingEnabled = false;


const W = canvas.width;
const H = canvas.height;

const WORLD_W = 4200;

const GROUND = 356;



// ==========================================================
// INPUT
// ==========================================================

const keys = {};
const pressed = {};


addEventListener(
    "keydown",
    e => {

        if (!keys[e.code]) {
            pressed[e.code] = true;
        }

        keys[e.code] = true;

        if (
            e.code === "Space" ||
            e.code.startsWith("Arrow")
        ) {
            e.preventDefault();
        }

    }
);


addEventListener(
    "keyup",
    e => {

        keys[e.code] = false;

    }
);



// ==========================================================
// WORLD
// ==========================================================

const world = {

    cameraX: 0,

    time: 0,

    shake: 0,

    flash: 0,

    hitStop: 0,

    lightning: 0,

    rainStrength: 1

};



// ==========================================================
// PLAYER
// ==========================================================

const player = {

    x: 310,

    y: GROUND - 108,

    w: 46,

    h: 108,

    vx: 0,

    vy: 0,

    facing: 1,

    speed: 3.4,

    jumpPower: 11.8,

    grounded: true,

    hp: 120,

    maxHp: 120,

    attackTimer: 0,

    attackCooldown: 0,

    combo: 0,

    comboWindow: 0,

    dashTimer: 0,

    dashCooldown: 0,

    inv: 0,

    animationTime: 0,

    frame: 0,

    state: "idle",

    hurtTimer: 0,

    dead: false

};



// ==========================================================
// ENEMIES
// ==========================================================

const enemyDefinitions = [

    ["knife", 830, 65],

    ["thug", 1260, 75],

    ["knife", 1750, 72],

    ["thug", 2150, 80],

    ["hunter", 2500, 95],

    ["boss", 3430, 360]

];


const enemies =
    enemyDefinitions.map(
        ([type, x, hp]) => {

            const boss =
                type === "boss";

            return {

                type,

                x,

                y:
                    boss
                        ? GROUND - 132
                        : GROUND - 91,

                w:
                    boss
                        ? 70
                        : 43,

                h:
                    boss
                        ? 132
                        : 91,

                hp,

                maxHp: hp,

                alive: true,

                facing: -1,

                speed:
                    boss
                        ? .68
                        : type === "hunter"
                            ? 1.15
                            : .95,

                anim: Math.random() * 8,

                hurt: 0,

                attack: 0,

                attackCooldown:
                    40 + Math.random() * 50,

                attackConnected: false,

                boss

            };

        }
    );



// ==========================================================
// PARTICLES
// ==========================================================

const particles = [];
const slashes = [];
const reflections = [];



const rain =
    Array.from(
        { length: 230 },
        () => ({

            x:
                Math.random() * W,

            y:
                Math.random() * H,

            speed:
                7 +
                Math.random() * 9,

            length:
                7 +
                Math.random() * 10,

            depth:
                .35 +
                Math.random() * .65

        })
    );



// ==========================================================
// HELPERS
// ==========================================================

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


function lerp(
    a,
    b,
    amount
) {

    return (
        a +
        (b - a) *
        amount
    );

}


function overlap(
    a,
    b
) {

    return (

        a.x <
        b.x + b.w &&

        a.x + a.w >
        b.x &&

        a.y <
        b.y + b.h &&

        a.y + a.h >
        b.y

    );

}


function rect(
    x,
    y,
    w,
    h,
    color,
    alpha = 1
) {

    const old =
        ctx.globalAlpha;

    ctx.globalAlpha =
        alpha;

    ctx.fillStyle =
        color;

    ctx.fillRect(
        Math.round(x),
        Math.round(y),
        Math.round(w),
        Math.round(h)
    );

    ctx.globalAlpha =
        old;

}


function polygon(
    points,
    color,
    alpha = 1
) {

    const old =
        ctx.globalAlpha;

    ctx.globalAlpha =
        alpha;

    ctx.fillStyle =
        color;

    ctx.beginPath();

    ctx.moveTo(
        points[0][0],
        points[0][1]
    );

    for (
        let i = 1;
        i < points.length;
        i++
    ) {

        ctx.lineTo(
            points[i][0],
            points[i][1]
        );

    }

    ctx.closePath();

    ctx.fill();

    ctx.globalAlpha =
        old;

}


function line(
    x1,
    y1,
    x2,
    y2,
    color,
    width = 1,
    alpha = 1
) {

    const old =
        ctx.globalAlpha;

    ctx.globalAlpha =
        alpha;

    ctx.strokeStyle =
        color;

    ctx.lineWidth =
        width;

    ctx.beginPath();

    ctx.moveTo(
        x1,
        y1
    );

    ctx.lineTo(
        x2,
        y2
    );

    ctx.stroke();

    ctx.globalAlpha =
        old;

}


function label(
    value,
    x,
    y,
    color = "#ddd",
    size = 10,
    align = "left"
) {

    ctx.textAlign =
        align;

    ctx.font =
        `${size}px monospace`;

    ctx.fillStyle =
        color;

    ctx.fillText(
        value,
        x,
        y
    );

    ctx.textAlign =
        "left";

}



// ==========================================================
// PASS 01
// SKY / COLOR COMPOSITION
// ==========================================================

function drawSky() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );


    gradient.addColorStop(
        0,
        "#080711"
    );

    gradient.addColorStop(
        .28,
        "#161128"
    );

    gradient.addColorStop(
        .55,
        "#25182f"
    );

    gradient.addColorStop(
        .78,
        "#170e1c"
    );

    gradient.addColorStop(
        1,
        "#070609"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    drawClouds();

    drawMoon();

}


function drawClouds() {

    const offset =
        world.cameraX *
        .018;


    for (
        let i = -2;
        i < 8;
        i++
    ) {

        const x =
            i * 180 -
            (
                offset %
                180
            );


        const y =
            40 +
            (
                i % 3
            ) *
            23;


        rect(
            x,
            y,
            130,
            14,
            "#342149",
            .18
        );


        rect(
            x + 25,
            y - 9,
            115,
            13,
            "#432756",
            .13
        );


        rect(
            x + 68,
            y + 10,
            145,
            11,
            "#261832",
            .17
        );

    }

}


function drawMoon() {

    const moonX =
        510 -
        world.cameraX *
        .018;


    const moonY = 91;


    const glow =
        ctx.createRadialGradient(
            moonX,
            moonY,
            10,
            moonX,
            moonY,
            75
        );


    glow.addColorStop(
        0,
        "rgba(222,166,174,.35)"
    );


    glow.addColorStop(
        1,
        "rgba(190,90,130,0)"
    );


    ctx.fillStyle =
        glow;


    ctx.fillRect(
        moonX - 80,
        moonY - 80,
        160,
        160
    );


    ctx.fillStyle =
        "#c4939d";


    ctx.beginPath();


    ctx.arc(
        moonX,
        moonY,
        43,
        0,
        Math.PI * 2
    );


    ctx.fill();


    rect(
        moonX - 23,
        moonY - 11,
        16,
        5,
        "#8a6573",
        .32
    );


    rect(
        moonX + 9,
        moonY + 6,
        18,
        8,
        "#936a78",
        .27
    );


    rect(
        moonX - 3,
        moonY + 22,
        12,
        5,
        "#876370",
        .24
    );

}



// ==========================================================
// PASS 02
// GOTHIC SKYLINE
// ==========================================================

function drawFarSkyline() {

    const shift =
        world.cameraX *
        .065;


    for (
        let i = -2;
        i < 25;
        i++
    ) {

        const x =
            i * 52 -
            (
                shift %
                52
            );


        const seed =
            (
                i * 37 +
                67
            );


        const height =
            78 +
            (
                seed %
                130
            );


        const top =
            GROUND -
            77 -
            height;


        rect(
            x,
            top,
            43,
            height,
            "#0e0e19"
        );


        if (
            i % 3 === 0
        ) {

            polygon(
                [

                    [
                        x + 5,
                        top
                    ],

                    [
                        x + 21,
                        top - 29
                    ],

                    [
                        x + 38,
                        top
                    ]

                ],
                "#0b0b15"
            );


            rect(
                x + 19,
                top - 43,
                4,
                17,
                "#0b0b15"
            );

        }


        if (
            i % 5 === 0
        ) {

            rect(
                x + 19,
                top - 55,
                3,
                55,
                "#0c0c16"
            );

        }


        for (
            let yy =
                top + 19;

            yy <
            GROUND - 90;

            yy += 18
        ) {

            for (
                let xx =
                    x + 9;

                xx <
                x + 36;

                xx += 13
            ) {

                const lit =
                    (
                        xx +
                        yy +
                        seed
                    ) %
                    7;


                if (
                    lit < 2
                ) {

                    rect(
                        xx,
                        yy,
                        2,
                        5,
                        "#d76d57",
                        .34
                    );

                }

            }

        }

    }

}



// ==========================================================
// PASS 03
// BROOKLYN BRIDGE
// ==========================================================

function drawBridge() {

    const base =
        1130 -
        world.cameraX *
        .14;


    const leftTower =
        base - 170;


    const rightTower =
        base + 170;


    line(
        base - 580,
        205,
        base + 600,
        205,
        "#262131",
        5
    );


    [
        leftTower,
        rightTower
    ].forEach(
        tx => {

            rect(
                tx - 21,
                94,
                42,
                119,
                "#11101a"
            );


            polygon(
                [

                    [
                        tx - 27,
                        95
                    ],

                    [
                        tx,
                        58
                    ],

                    [
                        tx + 27,
                        95
                    ]

                ],
                "#0f0f18"
            );


            rect(
                tx - 3,
                42,
                6,
                36,
                "#0d0d16"
            );


            rect(
                tx - 12,
                111,
                24,
                58,
                "#07070d"
            );


            rect(
                tx - 8,
                117,
                16,
                46,
                "#18131f"
            );

        }
    );


    ctx.strokeStyle =
        "#332b40";


    ctx.lineWidth =
        2;


    ctx.beginPath();


    ctx.moveTo(
        leftTower,
        70
    );


    ctx.quadraticCurveTo(
        base,
        196,
        rightTower,
        70
    );


    ctx.stroke();


    for (
        let i = -165;
        i <= 165;
        i += 14
    ) {

        const xx =
            base + i;


        const sag =
            70 +
            (
                126 *
                (
                    1 -
                    Math.pow(
                        Math.abs(i) /
                        170,
                        .62
                    )
                )
            );


        line(
            xx,
            sag,
            xx,
            204,
            "#292334",
            1,
            .72
        );

    }


    for (
        let i = -155;
        i <= 155;
        i += 25
    ) {

        rect(
            base + i,
            194,
            2,
            2,
            "#b92c43",
            .75
        );

    }

}



// ==========================================================
// PASS 04
// GOTHIC STREET ARCHITECTURE
// ==========================================================

function brickWall(
    x,
    y,
    width,
    height,
    shade
) {

    rect(
        x,
        y,
        width,
        height,
        shade
    );


    for (
        let yy =
            y + 5;

        yy <
        y + height;

        yy += 8
    ) {

        line(
            x,
            yy,
            x + width,
            yy,
            "#291922",
            1,
            .7
        );


        const stagger =
            (
                Math.floor(
                    (
                        yy -
                        y
                    ) /
                    8
                ) %
                2
            ) *
            8;


        for (
            let xx =
                x +
                stagger;

            xx <
            x + width;

            xx += 17
        ) {

            line(
                xx,
                yy - 8,
                xx,
                yy,
                "#251720",
                1,
                .55
            );

        }

    }

}


function drawNocturneBuilding() {

    const x =
        58 -
        world.cameraX;


    if (
        x < -360 ||
        x > W + 50
    ) {
        return;
    }


    brickWall(
        x,
        30,
        310,
        GROUND - 30,
        "#171117"
    );


    // windows

    for (
        let floor = 0;
        floor < 2;
        floor++
    ) {

        for (
            let column = 0;
            column < 3;
            column++
        ) {

            const wx =
                x +
                75 +
                column * 61;


            const wy =
                62 +
                floor * 73;


            rect(
                wx,
                wy,
                39,
                54,
                "#08070a"
            );


            rect(
                wx + 4,
                wy + 4,
                31,
                46,
                "#d7793d",
                .25
            );


            line(
                wx + 19,
                wy + 3,
                wx + 19,
                wy + 51,
                "#3c2221",
                2
            );


            line(
                wx + 3,
                wy + 25,
                wx + 36,
                wy + 25,
                "#3c2221",
                2
            );

        }

    }


    // VOID vertical sign

    rect(
        x + 15,
        81,
        38,
        133,
        "#12070c"
    );


    rect(
        x + 19,
        85,
        30,
        125,
        "#45101e"
    );


    ["V","O","I","D"]
    .forEach(
        (letter, index) => {

            label(
                letter,
                x + 34,
                111 +
                index * 28,
                "#e5495b",
                18,
                "center"
            );

        }
    );


    // bar sign

    rect(
        x + 79,
        208,
        191,
        47,
        "#10080d"
    );


    rect(
        x + 84,
        213,
        181,
        37,
        "#331019"
    );


    label(
        "NOCTURNE",
        x + 174,
        233,
        "#e05661",
        17,
        "center"
    );


    label(
        "BAR",
        x + 174,
        245,
        "#b53548",
        7,
        "center"
    );


    // ground windows

    for (
        let column = 0;
        column < 3;
        column++
    ) {

        const wx =
            x +
            76 +
            column * 65;


        rect(
            wx,
            268,
            51,
            86,
            "#070609"
        );


        rect(
            wx + 4,
            273,
            43,
            77,
            "#d75937",
            .27
        );


        rect(
            wx + 10,
            288,
            12,
            57,
            "#ee7f42",
            .12
        );

    }

}


function drawMidBuildings() {

    const shift =
        world.cameraX *
        .38;


    for (
        let i = -2;
        i < 10;
        i++
    ) {

        const x =
            i * 170 -
            (
                shift %
                170
            );


        const height =
            146 +
            (
                (
                    i * 41 +
                    97
                ) %
                93
            );


        rect(
            x,
            GROUND -
            height,
            148,
            height,
            i % 2
                ? "#16121a"
                : "#19131b"
        );


        for (
            let yy =
                GROUND -
                height +
                20;

            yy <
            GROUND - 40;

            yy += 42
        ) {

            for (
                let xx =
                    x + 18;

                xx <
                x + 127;

                xx += 38
            ) {

                rect(
                    xx,
                    yy,
                    16,
                    27,
                    "#07070a"
                );


                if (
                    (
                        xx +
                        yy
                    ) %
                    5 <
                    2
                ) {

                    rect(
                        xx + 3,
                        yy + 3,
                        10,
                        21,
                        "#b85b40",
                        .23
                    );

                }

            }

        }

    }

}



// ==========================================================
// FOREGROUND GATE + GARGOYLE
// ==========================================================

function drawGate() {

    const gateX =
        2760 -
        world.cameraX;


    if (
        gateX <
        W + 170 &&
        gateX >
        -400
    ) {

        for (
            let i = 0;
            i < 13;
            i++
        ) {

            const x =
                gateX +
                i * 28;


            rect(
                x,
                256,
                4,
                100,
                "#16141b"
            );


            polygon(
                [

                    [
                        x - 3,
                        256
                    ],

                    [
                        x + 2,
                        243
                    ],

                    [
                        x + 7,
                        256
                    ]

                ],
                "#24202a"
            );

        }


        line(
            gateX,
            280,
            gateX + 350,
            280,
            "#29242d",
            5
        );

    }

}


function drawGargoyle() {

    const x =
        2970 -
        world.cameraX;


    if (
        x < -130 ||
        x >
        W + 130
    ) {
        return;
    }


    rect(
        x - 23,
        270,
        88,
        86,
        "#18151d"
    );


    polygon(
        [

            [x, 238],

            [x + 21, 213],

            [x + 36, 240],

            [x + 31, 282],

            [x + 4, 282]

        ],
        "#29242f"
    );


    polygon(
        [

            [x + 13, 226],

            [x - 18, 202],

            [x - 2, 254]

        ],
        "#211d29"
    );


    polygon(
        [

            [x + 27, 225],

            [x + 57, 196],

            [x + 41, 254]

        ],
        "#211d29"
    );


    rect(
        x + 13,
        231,
        4,
        3,
        "#8e3347"
    );

}



// ==========================================================
// PASS 05
// LIGHTING + WET STREET
// ==========================================================

function lamp(
    worldX
) {

    const x =
        worldX -
        world.cameraX;


    if (
        x < -90 ||
        x >
        W + 90
    ) {
        return;
    }


    rect(
        x,
        176,
        6,
        180,
        "#1c181c"
    );


    rect(
        x - 12,
        168,
        30,
        12,
        "#29201f"
    );


    rect(
        x - 8,
        173,
        22,
        35,
        "#5b412e"
    );


    rect(
        x - 4,
        177,
        14,
        27,
        "#ffc578",
        .72
    );


    const glow =
        ctx.createRadialGradient(
            x + 3,
            190,
            3,
            x + 3,
            190,
            74
        );


    glow.addColorStop(
        0,
        "rgba(255,174,87,.29)"
    );


    glow.addColorStop(
        1,
        "rgba(255,130,60,0)"
    );


    ctx.fillStyle =
        glow;


    ctx.fillRect(
        x - 80,
        112,
        166,
        155
    );

}


function drawStreet() {

    const gradient =
        ctx.createLinearGradient(
            0,
            GROUND,
            0,
            H
        );


    gradient.addColorStop(
        0,
        "#111016"
    );


    gradient.addColorStop(
        1,
        "#030306"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        GROUND,
        W,
        H - GROUND
    );


    rect(
        0,
        GROUND,
        W,
        4,
        "#42313a"
    );


    // sidewalk detail

    for (
        let i = 0;
        i < 28;
        i++
    ) {

        const x =
            (
                i * 41 -
                world.cameraX *
                .78
            ) %
            920;


        line(
            x,
            GROUND + 3,
            x - 12,
            H,
            "#211920",
            1,
            .5
        );

    }


    // reflection puddles

    const neon = [

        [
            80,
            "#d32747"
        ],

        [
            210,
            "#e5773d"
        ],

        [
            352,
            "#8e285b"
        ],

        [
            490,
            "#ffac5c"
        ],

        [
            630,
            "#d82a54"
        ]

    ];


    neon.forEach(
        ([baseX, color]) => {

            const x =
                (
                    baseX -
                    world.cameraX *
                    .72
                ) %
                900;


            for (
                let row = 0;
                row < 10;
                row++
            ) {

                const wobble =
                    Math.sin(
                        world.time * 5 +
                        row
                    ) *
                    7;


                rect(
                    x +
                    wobble -
                    row,
                    GROUND +
                    8 +
                    row * 7,
                    46 -
                    row * 2,
                    2,
                    color,
                    .19 -
                    row *
                    .012
                );

            }

        }
    );

}



// ==========================================================
// PASS 06/07
// DETAILED HERO + FRAME ANIMATION
// ==========================================================

function heroState() {

    if (player.dead) {
        return "death";
    }


    if (
        player.hurtTimer > 0
    ) {
        return "hurt";
    }


    if (
        player.attackTimer > 0
    ) {
        return "attack";
    }


    if (
        player.dashTimer > 0
    ) {
        return "dash";
    }


    if (!player.grounded) {

        return (
            player.vy < 0
                ? "jump"
                : "fall"
        );

    }


    if (
        Math.abs(
            player.vx
        ) >
        2.6
    ) {
        return "run";
    }


    if (
        Math.abs(
            player.vx
        ) >
        .3
    ) {
        return "walk";
    }


    return "idle";

}


function drawHero() {

    let x =
        Math.round(
            player.x -
            world.cameraX
        );


    const y =
        Math.round(
            player.y
        );


    if (
        x < -150 ||
        x >
        W + 150
    ) {
        return;
    }


    const state =
        heroState();


    const t =
        player.animationTime;


    let legA = 0;
    let legB = 0;
    let torso = 0;
    let armA = 0;
    let armB = 0;


    if (
        state === "walk"
    ) {

        legA =
            Math.sin(
                t * 8
            ) *
            7;


        legB =
            -legA;


        armA =
            -legA *
            .55;


        armB =
            -legB *
            .55;

    }


    if (
        state === "run"
    ) {

        legA =
            Math.sin(
                t * 11
            ) *
            10;


        legB =
            -legA;


        armA =
            -legA *
            .7;


        armB =
            -legB *
            .7;


        torso = -3;

    }


    if (
        state === "idle"
    ) {

        torso =
            Math.sin(
                t * 2
            ) *
            1.3;

    }


    ctx.save();


    if (
        player.inv > 0 &&
        player.inv %
        8 <
        4
    ) {

        ctx.globalAlpha =
            .45;

    }


    if (
        player.facing < 0
    ) {

        ctx.translate(
            x + 23,
            0
        );


        ctx.scale(
            -1,
            1
        );


        ctx.translate(
            -(x + 23),
            0
        );

    }


    // DASH AFTERIMAGES

    if (
        state === "dash"
    ) {

        for (
            let i = 1;
            i < 5;
            i++
        ) {

            const ghostX =
                x -
                i * 13;


            polygon(
                [

                    [
                        ghostX + 5,
                        y + 28
                    ],

                    [
                        ghostX + 40,
                        y + 27
                    ],

                    [
                        ghostX + 45,
                        y + 90
                    ],

                    [
                        ghostX + 8,
                        y + 99
                    ]

                ],
                "#6d1737",
                .11 /
                i
            );

        }

    }


    // shadow

    rect(
        x - 2,
        GROUND - 4,
        54,
        4,
        "#000000",
        .62
    );


    // BOOTS

    rect(
        x + 8,
        y + 86 +
        legA * .26,
        13,
        21,
        "#08080c"
    );


    rect(
        x + 28,
        y + 86 +
        legB * .26,
        13,
        21,
        "#08080c"
    );


    rect(
        x + 3,
        y + 101 +
        legA * .26,
        20,
        7,
        "#060609"
    );


    rect(
        x + 26,
        y + 101 +
        legB * .26,
        21,
        7,
        "#060609"
    );


    // TROUSERS

    polygon(
        [

            [x + 11, y + 63],

            [
                x + 25,
                y + 63
            ],

            [
                x + 21,
                y + 93 +
                legA * .25
            ],

            [x + 9, y + 93]

        ],
        "#111015"
    );


    polygon(
        [

            [x + 25, y + 63],

            [x + 39, y + 63],

            [x + 42, y + 93],

            [
                x + 28,
                y + 93 +
                legB * .25
            ]

        ],
        "#141117"
    );


    // LONG COAT / VEST TAILS

    polygon(
        [

            [
                x + 4,
                y + 40 + torso
            ],

            [
                x + 43,
                y + 39 + torso
            ],

            [x + 47, y + 78],

            [x + 36, y + 96],

            [x + 27, y + 69],

            [x + 12, y + 98],

            [x + 1, y + 82]

        ],
        "#111015"
    );


    polygon(
        [

            [
                x + 9,
                y + 40 + torso
            ],

            [
                x + 41,
                y + 40 + torso
            ],

            [x + 38, y + 67],

            [x + 28, y + 64],

            [x + 16, y + 68],

            [x + 7, y + 64]

        ],
        "#252028"
    );


    // muscular exposed torso

    rect(
        x + 15,
        y + 36 + torso,
        21,
        34,
        "#b67c72"
    );


    rect(
        x + 17,
        y + 39 + torso,
        17,
        3,
        "#cf9184",
        .55
    );


    line(
        x + 25,
        y + 41 + torso,
        x + 25,
        y + 65 + torso,
        "#71494a",
        1
    );


    line(
        x + 17,
        y + 51 + torso,
        x + 34,
        y + 51 + torso,
        "#835052",
        1,
        .65
    );


    line(
        x + 18,
        y + 59 + torso,
        x + 33,
        y + 59 + torso,
        "#835052",
        1,
        .6
    );


    // leather lapels

    polygon(
        [

            [x + 9, y + 38],

            [x + 18, y + 37],

            [x + 21, y + 65],

            [x + 10, y + 64]

        ],
        "#111015"
    );


    polygon(
        [

            [x + 40, y + 38],

            [x + 32, y + 37],

            [x + 29, y + 65],

            [x + 40, y + 64]

        ],
        "#101014"
    );


    line(
        x + 13,
        y + 40,
        x + 19,
        y + 62,
        "#50434b",
        1
    );


    line(
        x + 36,
        y + 40,
        x + 30,
        y + 62,
        "#50434b",
        1
    );


    // arms

    let rightArmX =
        x + 38;


    let rightArmY =
        y + 43 +
        armA * .2;


    let leftArmX =
        x + 4;


    let leftArmY =
        y + 43 +
        armB * .2;


    if (
        state === "attack"
    ) {

        if (
            player.combo === 1
        ) {

            rightArmX =
                x + 39;

            rightArmY =
                y + 45;

        }


        if (
            player.combo === 2
        ) {

            rightArmX =
                x + 42;

            rightArmY =
                y + 33;

        }


        if (
            player.combo === 3
        ) {

            rightArmX =
                x + 38;

            rightArmY =
                y + 51;

        }

    }


    rect(
        leftArmX,
        leftArmY,
        9,
        29,
        "#b87d73"
    );


    rect(
        rightArmX,
        rightArmY,
        state === "attack"
            ? 31
            : 9,
        state === "attack"
            ? 9
            : 29,
        "#bb8076"
    );


    // tattoos

    rect(
        leftArmX + 2,
        leftArmY + 3,
        3,
        5,
        "#33252c"
    );


    rect(
        leftArmX + 4,
        leftArmY + 11,
        2,
        8,
        "#33252c"
    );


    rect(
        leftArmX + 1,
        leftArmY + 21,
        5,
        2,
        "#33252c"
    );


    if (
        state !== "attack"
    ) {

        rect(
            rightArmX + 3,
            rightArmY + 5,
            3,
            6,
            "#33252c"
        );


        rect(
            rightArmX + 2,
            rightArmY + 16,
            5,
            2,
            "#33252c"
        );

    }


    // gloves

    rect(
        leftArmX - 1,
        leftArmY + 25,
        11,
        8,
        "#101015"
    );


    if (
        state !== "attack"
    ) {

        rect(
            rightArmX - 1,
            rightArmY + 25,
            11,
            8,
            "#101015"
        );

    }
    else {

        rect(
            rightArmX + 27,
            rightArmY - 1,
            10,
            11,
            "#101015"
        );

    }


    // neck

    rect(
        x + 20,
        y + 27 + torso,
        11,
        13,
        "#aa7169"
    );


    // head

    rect(
        x + 15,
        y + 8 + torso,
        22,
        24,
        "#bd8379"
    );


    rect(
        x + 18,
        y + 10 + torso,
        18,
        4,
        "#d39a8e",
        .65
    );


    // long black hair

    polygon(
        [

            [x + 11, y + 5],

            [x + 38, y + 4],

            [x + 44, y + 15],

            [x + 41, y + 42],

            [x + 35, y + 34],

            [x + 37, y + 17],

            [x + 30, y + 10],

            [x + 16, y + 13],

            [x + 13, y + 41],

            [x + 7, y + 32]

        ],
        "#08080c"
    );


    rect(
        x + 7,
        y + 17,
        7,
        32,
        "#0d0d12"
    );


    rect(
        x + 38,
        y + 16,
        7,
        36,
        "#0c0c11"
    );


    // face

    rect(
        x + 28,
        y + 18 + torso,
        3,
        2,
        "#d92b45"
    );


    rect(
        x + 20,
        y + 18 + torso,
        2,
        2,
        "#2e1b22"
    );


    rect(
        x + 23,
        y + 27 + torso,
        9,
        2,
        "#6f3d42"
    );


    // necklace

    line(
        x + 24,
        y + 34,
        x + 27,
        y + 48,
        "#b6a7a7",
        1
    );


    line(
        x + 23,
        y + 42,
        x + 31,
        y + 42,
        "#b6a7a7",
        1
    );


    line(
        x + 27,
        y + 39,
        x + 27,
        y + 46,
        "#b6a7a7",
        1
    );


    ctx.restore();

}



// ==========================================================
// PASS 08
// ENEMY SPRITES + ATTACK ANIMATIONS
// ==========================================================

function enemyFacingTransform(
    enemy,
    x,
    callback
) {

    ctx.save();


    if (
        enemy.facing < 0
    ) {

        ctx.translate(
            x +
            enemy.w / 2,
            0
        );


        ctx.scale(
            -1,
            1
        );


        ctx.translate(
            -(
                x +
                enemy.w / 2
            ),
            0
        );

    }


    callback();


    ctx.restore();

}


function drawKnifeEnemy(
    enemy,
    x,
    y
) {

    const bob =
        Math.sin(
            enemy.anim * 2
        ) *
        1.2;


    rect(
        x + 7,
        y + 60,
        9,
        31,
        "#151318"
    );


    rect(
        x + 26,
        y + 60,
        9,
        31,
        "#151318"
    );


    polygon(
        [

            [x + 5, y + 28],

            [x + 37, y + 25],

            [x + 42, y + 64],

            [x + 2, y + 66]

        ],
        enemy.hurt
            ? "#d0a19d"
            : "#39322f"
    );


    rect(
        x + 11,
        y + 8 + bob,
        23,
        23,
        "#9d776d"
    );


    polygon(
        [

            [x + 7, y + 10],

            [x + 35, y + 5],

            [x + 37, y + 17],

            [x + 9, y + 17]

        ],
        "#1a1518"
    );


    rect(
        x + 29,
        y + 16,
        3,
        2,
        "#c94953"
    );


    if (
        enemy.attack > 0
    ) {

        rect(
            x + 34,
            y + 39,
            31,
            7,
            "#a9766d"
        );


        polygon(
            [

                [x + 61, y + 38],

                [x + 78, y + 41],

                [x + 61, y + 46]

            ],
            "#c6b8a5"
        );

    }
    else {

        rect(
            x + 34,
            y + 39,
            14,
            7,
            "#a9766d"
        );


        polygon(
            [

                [x + 46, y + 38],

                [x + 61, y + 41],

                [x + 46, y + 46]

            ],
            "#bdb09e"
        );

    }

}


function drawThugEnemy(
    enemy,
    x,
    y
) {

    const bob =
        Math.sin(
            enemy.anim * 1.7
        );


    rect(
        x + 7,
        y + 60,
        10,
        31,
        "#171418"
    );


    rect(
        x + 27,
        y + 60,
        10,
        31,
        "#171418"
    );


    rect(
        x + 3,
        y + 27,
        39,
        39,
        enemy.hurt
            ? "#d4a3a0"
            : "#4e3935"
    );


    rect(
        x + 9,
        y + 7 + bob,
        27,
        24,
        "#a47b70"
    );


    rect(
        x + 7,
        y + 4 + bob,
        31,
        8,
        "#191418"
    );


    rect(
        x + 31,
        y + 16,
        3,
        2,
        "#ce4750"
    );


    if (
        enemy.attack > 0
    ) {

        rect(
            x + 35,
            y + 38,
            34,
            10,
            "#a87a70"
        );

    }
    else {

        rect(
            x + 36,
            y + 40,
            12,
            9,
            "#a87a70"
        );

    }

}


function drawHunterEnemy(
    enemy,
    x,
    y
) {

    polygon(
        [

            [x + 3, y + 27],

            [x + 39, y + 24],

            [x + 44, y + 89],

            [x + 21, y + 77],

            [x, y + 90]

        ],
        enemy.hurt
            ? "#d0bdbe"
            : "#282838"
    );


    rect(
        x + 10,
        y + 7,
        25,
        24,
        "#ad8a80"
    );


    rect(
        x + 7,
        y + 4,
        31,
        8,
        "#111018"
    );


    rect(
        x + 30,
        y + 16,
        3,
        2,
        "#ddb65f"
    );


    const gunExtension =
        enemy.attack > 0
            ? 38
            : 23;


    rect(
        x + 33,
        y + 41,
        gunExtension,
        6,
        "#77716e"
    );


    rect(
        x +
        31 +
        gunExtension,
        y + 36,
        6,
        16,
        "#343136"
    );


    if (
        enemy.attack > 6
    ) {

        polygon(
            [

                [
                    x +
                    39 +
                    gunExtension,
                    y + 38
                ],

                [
                    x +
                    55 +
                    gunExtension,
                    y + 44
                ],

                [
                    x +
                    39 +
                    gunExtension,
                    y + 50
                ]

            ],
            "#ffc46c",
            .85
        );

    }

}


function drawBoss(
    enemy,
    x,
    y
) {

    const pulse =
        Math.sin(
            enemy.anim
        ) *
        2;


    rect(
        x + 9,
        y + 87,
        16,
        45,
        "#151217"
    );


    rect(
        x + 44,
        y + 87,
        16,
        45,
        "#151217"
    );


    polygon(
        [

            [x + 3, y + 37],

            [x + 65, y + 32],

            [x + 70, y + 96],

            [x, y + 99]

        ],
        enemy.hurt
            ? "#d3a19d"
            : "#612d38"
    );


    rect(
        x + 14,
        y + 8 + pulse,
        43,
        33,
        "#a7766f"
    );


    rect(
        x + 9,
        y + 3 + pulse,
        53,
        12,
        "#20161b"
    );


    rect(
        x + 48,
        y + 20,
        4,
        3,
        "#e6374e"
    );


    rect(
        x + 58,
        y + 52,
        enemy.attack > 0
            ? 73
            : 49,
        10,
        "#46403d"
    );


    polygon(
        [

            [
                x +
                (
                    enemy.attack > 0
                        ? 124
                        : 101
                ),
                y + 41
            ],

            [
                x +
                (
                    enemy.attack > 0
                        ? 154
                        : 130
                ),
                y + 56
            ],

            [
                x +
                (
                    enemy.attack > 0
                        ? 126
                        : 103
                ),
                y + 74
            ]

        ],
        "#989088"
    );


    rect(
        x + 7,
        y + 49,
        19,
        5,
        "#3a2027"
    );


    rect(
        x + 13,
        y + 61,
        27,
        4,
        "#401b25"
    );

}


function drawEnemy(
    enemy
) {

    if (
        !enemy.alive
    ) {
        return;
    }


    const x =
        Math.round(
            enemy.x -
            world.cameraX
        );


    const y =
        Math.round(
            enemy.y
        );


    if (
        x < -180 ||
        x >
        W + 180
    ) {
        return;
    }


    enemyFacingTransform(
        enemy,
        x,
        () => {

            rect(
                x,
                GROUND - 4,
                enemy.w + 6,
                4,
                "#000",
                .55
            );


            if (
                enemy.type ===
                "knife"
            ) {

                drawKnifeEnemy(
                    enemy,
                    x,
                    y
                );

            }


            if (
                enemy.type ===
                "thug"
            ) {

                drawThugEnemy(
                    enemy,
                    x,
                    y
                );

            }


            if (
                enemy.type ===
                "hunter"
            ) {

                drawHunterEnemy(
                    enemy,
                    x,
                    y
                );

            }


            if (
                enemy.type ===
                "boss"
            ) {

                drawBoss(
                    enemy,
                    x,
                    y
                );

            }

        }
    );

}



// ==========================================================
// PASS 09
// COMBAT VFX
// ==========================================================

function particleBurst(
    x,
    y,
    count,
    type
) {

    for (
        let i = 0;
        i < count;
        i++
    ) {

        particles.push({

            x,
            y,

            vx:
                (
                    Math.random() -
                    .5
                ) *
                (
                    type ===
                    "spark"
                        ? 8
                        : 6
                ),

            vy:
                -Math.random() *
                (
                    type ===
                    "spark"
                        ? 7
                        : 5
                ),

            life:
                18 +
                Math.random() *
                24,

            size:
                1 +
                Math.random() *
                2,

            type

        });

    }

}


function createSlash() {

    slashes.push({

        x:
            player.x +
            player.w /
            2,

        y:
            player.y +
            42,

        facing:
            player.facing,

        combo:
            player.combo,

        life: 10,

        maxLife: 10

    });

}


function attackHitBox() {

    const reach =
        player.combo === 3
            ? 73
            : 57;


    return {

        x:
            player.facing > 0
                ? player.x + 23
                : player.x -
                  reach +
                  22,

        y:
            player.y + 19,

        w: reach,

        h: 69

    };

}


function playerAttack() {

    if (
        player.dead ||
        player.attackCooldown >
        0
    ) {
        return;
    }


    player.combo =
        player.comboWindow > 0

            ? player.combo %
              3 + 1

            : 1;


    player.comboWindow =
        30;


    player.attackTimer =
        player.combo === 3
            ? 18
            : 13;


    player.attackCooldown =
        player.combo === 3
            ? 20
            : 14;


    createSlash();


    const hit =
        attackHitBox();


    enemies.forEach(
        enemy => {

            if (
                !enemy.alive ||
                !overlap(
                    hit,
                    enemy
                )
            ) {
                return;
            }


            let damage =
                player.combo === 1
                    ? 24

                    : player.combo === 2
                        ? 30

                        : 43;


            if (
                enemy.boss
            ) {

                damage =
                    Math.floor(
                        damage *
                        .67
                    );

            }


            enemy.hp -=
                damage;


            enemy.hurt =
                11;


            enemy.x +=
                player.facing *
                (
                    player.combo === 3
                        ? 27
                        : 14
                );


            world.hitStop =
                player.combo === 3
                    ? 6
                    : 3;


            world.shake =
                player.combo === 3
                    ? 8
                    : 4;


            world.flash =
                2;


            particleBurst(
                enemy.x +
                enemy.w /
                2,
                enemy.y +
                enemy.h /
                2,
                player.combo === 3
                    ? 25
                    : 14,
                "blood"
            );


            particleBurst(
                enemy.x +
                enemy.w /
                2,
                enemy.y +
                enemy.h /
                2,
                6,
                "spark"
            );


            if (
                enemy.hp <= 0
            ) {

                enemy.alive =
                    false;


                particleBurst(
                    enemy.x +
                    enemy.w /
                    2,
                    enemy.y +
                    enemy.h /
                    2,
                    36,
                    "blood"
                );

            }

        }
    );

}


function playerDash() {

    if (
        player.dead ||
        player.dashCooldown >
        0
    ) {
        return;
    }


    player.dashTimer =
        12;


    player.dashCooldown =
        46;


    player.inv =
        17;

}



// ==========================================================
// PLAYER UPDATE
// ==========================================================

function updatePlayer() {

    if (
        player.dead
    ) {

        if (
            pressed.KeyR
        ) {

            location.reload();

        }

        return;

    }


    let direction = 0;


    if (
        keys.KeyA ||
        keys.ArrowLeft
    ) {

        direction--;

    }


    if (
        keys.KeyD ||
        keys.ArrowRight
    ) {

        direction++;

    }


    if (
        pressed.KeyJ
    ) {

        playerAttack();

    }


    if (
        pressed.KeyK ||
        pressed.ShiftLeft ||
        pressed.ShiftRight
    ) {

        playerDash();

    }


    if (
        (
            pressed.Space ||
            pressed.KeyW ||
            pressed.ArrowUp
        ) &&
        player.grounded
    ) {

        player.vy =
            -player.jumpPower;


        player.grounded =
            false;

    }


    if (
        player.dashTimer > 0
    ) {

        player.vx =
            player.facing *
            8.1;


        player.dashTimer--;

    }
    else {

        player.vx +=
            direction *
            .58;


        player.vx =
            clamp(
                player.vx,
                -player.speed,
                player.speed
            );


        if (
            direction === 0
        ) {

            player.vx *=
                .76;

        }


        if (
            direction
        ) {

            player.facing =
                Math.sign(
                    direction
                );

        }

    }


    player.vy +=
        .56;


    player.x +=
        player.vx;


    player.y +=
        player.vy;


    if (
        player.y +
        player.h >=
        GROUND
    ) {

        player.y =
            GROUND -
            player.h;


        player.vy = 0;


        player.grounded =
            true;

    }


    player.x =
        clamp(
            player.x,
            20,
            WORLD_W - 100
        );


    player.animationTime +=
        .016 +
        Math.abs(
            player.vx
        ) *
        .0015;


    player.state =
        heroState();


    if (
        player.attackTimer > 0
    ) {

        player.attackTimer--;

    }


    if (
        player.attackCooldown > 0
    ) {

        player.attackCooldown--;

    }


    if (
        player.comboWindow > 0
    ) {

        player.comboWindow--;

    }
    else {

        player.combo = 0;

    }


    if (
        player.dashCooldown > 0
    ) {

        player.dashCooldown--;

    }


    if (
        player.inv > 0
    ) {

        player.inv--;

    }


    if (
        player.hurtTimer > 0
    ) {

        player.hurtTimer--;

    }


    const target =
        player.x -
        W *
        .40;


    world.cameraX =
        lerp(
            world.cameraX,
            target,
            .07
        );


    world.cameraX =
        clamp(
            world.cameraX,
            0,
            WORLD_W -
            W
        );

}



// ==========================================================
// ENEMY AI / ATTACK TELEGRAPH
// ==========================================================

function enemyAttackRange(
    enemy
) {

    if (
        enemy.type ===
        "hunter"
    ) {
        return 145;
    }


    if (
        enemy.boss
    ) {
        return 105;
    }


    return 55;

}


function damagePlayer(
    enemy
) {

    if (
        player.inv >
        0
    ) {
        return;
    }


    const damage =
        enemy.boss
            ? 27

            : enemy.type ===
              "hunter"
                ? 17

                : 12;


    player.hp -=
        damage;


    player.inv =
        50;


    player.hurtTimer =
        12;


    player.vx =
        Math.sign(
            player.x -
            enemy.x
        ) *
        5;


    player.vy =
        -4;


    world.shake =
        enemy.boss
            ? 9
            : 5;


    particleBurst(
        player.x +
        player.w /
        2,
        player.y + 44,
        13,
        "blood"
    );


    if (
        player.hp <= 0
    ) {

        player.hp = 0;

        player.dead =
            true;

    }

}


function updateEnemies() {

    enemies.forEach(
        enemy => {

            if (
                !enemy.alive ||
                player.dead
            ) {
                return;
            }


            enemy.anim +=
                .055;


            if (
                enemy.hurt > 0
            ) {

                enemy.hurt--;

            }


            if (
                enemy.attackCooldown >
                0
            ) {

                enemy.attackCooldown--;

            }


            const dx =
                player.x -
                enemy.x;


            enemy.facing =
                Math.sign(dx) ||
                enemy.facing;


            const distance =
                Math.abs(dx);


            const range =
                enemyAttackRange(
                    enemy
                );


            if (
                enemy.attack > 0
            ) {

                enemy.attack--;


                if (
                    enemy.attack === 7 &&
                    !enemy.attackConnected
                ) {

                    const attackRect = {

                        x:
                            enemy.facing > 0
                                ? enemy.x +
                                  enemy.w *
                                  .55

                                : enemy.x -
                                  range +
                                  enemy.w *
                                  .45,

                        y:
                            enemy.y + 18,

                        w: range,

                        h:
                            enemy.h - 25

                    };


                    if (
                        overlap(
                            attackRect,
                            player
                        )
                    ) {

                        damagePlayer(
                            enemy
                        );

                    }


                    enemy.attackConnected =
                        true;

                }


                return;

            }


            if (
                distance <
                range *
                .82 &&
                enemy.attackCooldown <=
                0
            ) {

                enemy.attack =
                    enemy.boss
                        ? 24
                        : 19;


                enemy.attackCooldown =
                    enemy.boss
                        ? 52
                        : 63;


                enemy.attackConnected =
                    false;


                return;

            }


            const detection =
                enemy.boss
                    ? 520
                    : 350;


            if (
                distance <
                detection &&
                distance >
                range *
                .68 &&
                enemy.hurt <= 0
            ) {

                enemy.x +=
                    Math.sign(dx) *
                    enemy.speed;

            }

        }
    );

}



// ==========================================================
// EFFECT UPDATE
// ==========================================================

function updateEffects() {

    for (
        let i =
            particles.length -
            1;

        i >= 0;

        i--
    ) {

        const p =
            particles[i];


        p.x +=
            p.vx;


        p.y +=
            p.vy;


        p.vy +=
            .18;


        p.vx *=
            .97;


        p.life--;


        if (
            p.life <= 0
        ) {

            particles.splice(
                i,
                1
            );

        }

    }


    for (
        let i =
            slashes.length -
            1;

        i >= 0;

        i--
    ) {

        slashes[i].life--;


        if (
            slashes[i].life <=
            0
        ) {

            slashes.splice(
                i,
                1
            );

        }

    }


    rain.forEach(
        drop => {

            drop.x -=
                2.4 *
                drop.depth;


            drop.y +=
                drop.speed *
                drop.depth;


            if (
                drop.y >
                H + 15
            ) {

                drop.y =
                    -20;


                drop.x =
                    Math.random() *
                    W;

            }

        }
    );


    world.shake *=
        .78;


    if (
        world.flash > 0
    ) {

        world.flash--;

    }


    world.time +=
        .016;

}



// ==========================================================
// DRAW PARTICLES
// ==========================================================

function drawSlashes() {

    slashes.forEach(
        slash => {

            const x =
                slash.x -
                world.cameraX;


            const alpha =
                slash.life /
                slash.maxLife;


            ctx.save();


            ctx.globalAlpha =
                alpha;


            ctx.strokeStyle =
                slash.combo === 3
                    ? "#ef214f"
                    : "#d73354";


            ctx.lineWidth =
                slash.combo === 3
                    ? 10
                    : 7;


            ctx.beginPath();


            if (
                slash.facing > 0
            ) {

                ctx.arc(
                    x + 8,
                    slash.y,
                    slash.combo === 3
                        ? 61
                        : 45,
                    -.9,
                    .70
                );

            }
            else {

                ctx.arc(
                    x - 8,
                    slash.y,
                    slash.combo === 3
                        ? 61
                        : 45,
                    Math.PI -
                    .70,
                    Math.PI +
                    .9
                );

            }


            ctx.stroke();


            ctx.globalAlpha =
                alpha *
                .7;


            ctx.strokeStyle =
                "#ffb0b9";


            ctx.lineWidth =
                2;


            ctx.stroke();


            ctx.restore();

        }
    );

}


function drawParticles() {

    particles.forEach(
        p => {

            const x =
                p.x -
                world.cameraX;


            const alpha =
                clamp(
                    p.life /
                    30,
                    0,
                    1
                );


            rect(
                x,
                p.y,
                p.size,
                p.size,
                p.type ===
                "blood"
                    ? "#bd1534"
                    : "#ffbf71",
                alpha
            );

        }
    );

}



// ==========================================================
// RAIN
// ==========================================================

function drawRain() {

    ctx.beginPath();


    rain.forEach(
        drop => {

            ctx.moveTo(
                drop.x,
                drop.y
            );


            ctx.lineTo(
                drop.x -
                4 *
                drop.depth,
                drop.y +
                drop.length
            );

        }
    );


    ctx.strokeStyle =
        "rgba(170,169,201,.27)";


    ctx.lineWidth =
        1;


    ctx.stroke();

}



// ==========================================================
// PASS 10
// CINEMATIC HUD
// ==========================================================

function drawPortrait(
    x,
    y
) {

    rect(
        x,
        y,
        53,
        59,
        "#080609"
    );


    rect(
        x + 3,
        y + 3,
        47,
        53,
        "#1c1119"
    );


    // neck

    rect(
        x + 19,
        y + 37,
        16,
        17,
        "#9c6863"
    );


    // face

    rect(
        x + 14,
        y + 10,
        25,
        32,
        "#b77c73"
    );


    rect(
        x + 18,
        y + 13,
        19,
        4,
        "#cb9285"
    );


    // hair

    polygon(
        [

            [x + 8, y + 7],

            [x + 37, y + 5],

            [x + 45, y + 13],

            [x + 42, y + 48],

            [x + 34, y + 38],

            [x + 38, y + 17],

            [x + 29, y + 10],

            [x + 16, y + 14],

            [x + 14, y + 47],

            [x + 6, y + 37]

        ],
        "#08080c"
    );


    rect(
        x + 28,
        y + 24,
        3,
        2,
        "#d42d48"
    );


    rect(
        x + 19,
        y + 24,
        3,
        2,
        "#25161c"
    );


    rect(
        x + 20,
        y + 34,
        12,
        2,
        "#713c42"
    );


    rect(
        x,
        y,
        53,
        2,
        "#69434f"
    );


    rect(
        x,
        y + 57,
        53,
        2,
        "#69434f"
    );

}


function drawHud() {

    // NIGHT BLOOD LOGO

    label(
        "NIGHT",
        14,
        31,
        "#c3223d",
        20
    );


    label(
        "BLOOD",
        14,
        51,
        "#b51f39",
        20
    );


    label(
        "BROOKLYN 1996",
        14,
        66,
        "#a18a91",
        7
    );


    label(
        "PROTOTYPE 0.14",
        14,
        79,
        "#8a7078",
        7
    );


    // portrait

    drawPortrait(
        93,
        10
    );


    // HP

    label(
        `HP ${player.hp}/${player.maxHp}`,
        156,
        22,
        "#e4d8da",
        10
    );


    rect(
        156,
        29,
        158,
        10,
        "#2a1118"
    );


    rect(
        158,
        31,
        154 *
        (
            player.hp /
            player.maxHp
        ),
        6,
        "#ce2342"
    );


    // dash/stamina

    rect(
        156,
        46,
        129,
        5,
        "#181321"
    );


    rect(
        156,
        46,
        129 *
        (
            1 -
            player.dashCooldown /
            46
        ),
        5,
        "#745199"
    );


    label(
        "THE STRAY",
        156,
        66,
        "#d7c6cb",
        9
    );


    label(
        "CAITIFF",
        156,
        77,
        "#9e7e89",
        8
    );


    // controls

    label(
        "[A][D]",
        W - 264,
        24,
        "#dfd1d4",
        8
    );


    label(
        "MOVE",
        W - 260,
        37,
        "#ad969f",
        7
    );


    label(
        "[SPACE]",
        W - 198,
        24,
        "#dfd1d4",
        8
    );


    label(
        "JUMP",
        W - 190,
        37,
        "#ad969f",
        7
    );


    label(
        "[J]",
        W - 125,
        24,
        "#dfd1d4",
        8
    );


    label(
        "ATTACK",
        W - 139,
        37,
        "#ad969f",
        7
    );


    label(
        "[K]",
        W - 58,
        24,
        "#dfd1d4",
        8
    );


    label(
        "DASH",
        W - 66,
        37,
        "#ad969f",
        7
    );


    const boss =
        enemies.find(
            e =>
                e.boss &&
                e.alive
        );


    if (
        boss &&
        Math.abs(
            boss.x -
            player.x
        ) <
        700
    ) {

        rect(
            128,
            H - 42,
            W - 256,
            28,
            "#040406",
            .91
        );


        label(
            "THE BUTCHER",
            W / 2,
            H - 29,
            "#e0cfd1",
            10,
            "center"
        );


        rect(
            166,
            H - 23,
            W - 332,
            7,
            "#311018"
        );


        rect(
            168,
            H - 21,
            (
                W -
                336
            ) *
            (
                boss.hp /
                boss.maxHp
            ),
            3,
            "#c6233e"
        );

    }


    if (
        player.dead
    ) {

        rect(
            0,
            0,
            W,
            H,
            "#000",
            .82
        );


        label(
            "THE NIGHT CLAIMS YOU",
            W / 2,
            H / 2,
            "#ded0d3",
            22,
            "center"
        );


        label(
            "PRESS R TO RISE AGAIN",
            W / 2,
            H / 2 +
            27,
            "#9c7b84",
            9,
            "center"
        );

    }

}



// ==========================================================
// ENVIRONMENT COMPOSITION
// ==========================================================

function drawEnvironment() {

    drawSky();

    drawFarSkyline();

    drawBridge();

    drawMidBuildings();

    drawNocturneBuilding();

    drawGate();

    drawGargoyle();

    lamp(
        1540
    );

    lamp(
        2290
    );

    lamp(
        3035
    );

    drawStreet();

}



// ==========================================================
// GAME LOOP
// ==========================================================

function update() {

    if (
        world.hitStop > 0
    ) {

        world.hitStop--;

    }
    else {

        updatePlayer();

        updateEnemies();

        updateEffects();

    }


    Object.keys(
        pressed
    ).forEach(
        key =>
            delete pressed[key]
    );

}


function draw() {

    ctx.save();


    if (
        world.shake >
        .1
    ) {

        ctx.translate(
            (
                Math.random() -
                .5
            ) *
            world.shake,

            (
                Math.random() -
                .5
            ) *
            world.shake
        );

    }


    drawEnvironment();


    enemies.forEach(
        drawEnemy
    );


    drawHero();


    drawSlashes();


    drawParticles();


    drawRain();


    ctx.restore();


    drawHud();


    if (
        world.flash > 0
    ) {

        rect(
            0,
            0,
            W,
            H,
            "#ffe3e9",
            .07
        );

    }

}


function loop() {

    update();

    draw();

    requestAnimationFrame(
        loop
    );

}


loop();
