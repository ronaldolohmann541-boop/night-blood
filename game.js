"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;

const WORLD_W = 3200;
const GROUND = 298;

const keys = {};
const pressed = {};

addEventListener("keydown", e => {

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
});

addEventListener("keyup", e => {
    keys[e.code] = false;
});


const world = {

    cameraX: 0,

    shake: 0,

    flash: 0,

    hitStop: 0,

    time: 0,

    rainTime: 0

};


const player = {

    x: 210,
    y: GROUND - 91,

    w: 40,
    h: 91,

    vx: 0,
    vy: 0,

    facing: 1,

    speed: 3.0,

    jumpPower: 10,

    grounded: true,

    hp: 120,
    maxHp: 120,

    attackTimer: 0,
    attackCooldown: 0,

    combo: 0,
    comboWindow: 0,

    dash: 0,
    dashCooldown: 0,

    inv: 0,

    anim: 0,

    dead: false
};


const enemyData = [

    ["thug", 610, 44],

    ["thug", 900, 48],

    ["hunter", 1230, 65],

    ["thug", 1620, 52],

    ["hunter", 1990, 70],

    ["boss", 2600, 280]

];


const enemies = enemyData.map(
    ([type, x, hp]) => ({

        type,
        x,

        y:
            type === "boss"
                ? GROUND - 109
                : GROUND - 80,

        w:
            type === "boss"
                ? 64
                : 40,

        h:
            type === "boss"
                ? 109
                : 80,

        hp,
        maxHp: hp,

        alive: true,

        facing: -1,

        cooldown: 0,

        hurt: 0,

        anim:
            Math.random() * 10,

        speed:
            type === "boss"
                ? 0.75
                : type === "hunter"
                    ? 1.25
                    : 1.0,

        boss:
            type === "boss"

    })
);


const particles = [];

const slashes = [];


const rain = Array.from(
    { length: 180 },
    () => ({

        x:
            Math.random() * W,

        y:
            Math.random() * H,

        speed:
            5 +
            Math.random() * 7,

        len:
            4 +
            Math.random() * 8

    })
);


function clamp(v, min, max) {

    return Math.max(
        min,
        Math.min(
            max,
            v
        )
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


function text(
    value,
    x,
    y,
    color = "#ddd",
    size = 8,
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


function overlap(a, b) {

    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );

}


function burst(
    x,
    y,
    amount,
    type
) {

    for (
        let i = 0;
        i < amount;
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
                    type === "spark"
                        ? 7
                        : 5
                ),

            vy:
                -Math.random() *
                (
                    type === "spark"
                        ? 6
                        : 4.5
                ),

            life:
                15 +
                Math.random() *
                24,

            type,

            size:
                type === "blood"
                    ? 1 +
                      Math.random() * 2
                    : 1

        });

    }

}


function spawnSlash() {

    slashes.push({

        x:
            player.x +
            player.w / 2,

        y:
            player.y +
            33,

        facing:
            player.facing,

        combo:
            player.combo,

        life: 9,

        maxLife: 9

    });

}


function attackBox() {

    const reach =
        player.combo === 3
            ? 60
            : 48;

    return {

        x:
            player.facing > 0
                ? player.x + 20
                : player.x - reach + 20,

        y:
            player.y + 14,

        w:
            reach,

        h:
            59

    };

}


function attack() {

    if (
        player.dead ||
        player.attackCooldown > 0
    ) {
        return;
    }


    player.combo =
        player.comboWindow > 0
            ? player.combo % 3 + 1
            : 1;


    player.comboWindow =
        28;


    player.attackTimer =
        player.combo === 3
            ? 16
            : 12;


    player.attackCooldown =
        player.combo === 3
            ? 19
            : 13;


    spawnSlash();


    const hit =
        attackBox();


    enemies.forEach(enemy => {

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
                ? 22
                : player.combo === 2
                    ? 27
                    : 40;


        if (enemy.boss) {
            damage =
                Math.floor(
                    damage * .72
                );
        }


        enemy.hp -= damage;

        enemy.hurt = 10;


        enemy.x +=
            player.facing *
            (
                player.combo === 3
                    ? 24
                    : 13
            );


        world.hitStop =
            player.combo === 3
                ? 5
                : 3;


        world.shake =
            player.combo === 3
                ? 7
                : 4;


        world.flash = 2;


        burst(
            enemy.x +
            enemy.w / 2,

            enemy.y +
            enemy.h / 2,

            player.combo === 3
                ? 22
                : 14,

            "blood"
        );


        burst(
            enemy.x +
            enemy.w / 2,

            enemy.y +
            enemy.h / 2,

            6,

            "spark"
        );


        if (enemy.hp <= 0) {

            enemy.alive =
                false;


            burst(
                enemy.x +
                enemy.w / 2,

                enemy.y +
                enemy.h / 2,

                34,

                "blood"
            );

        }

    });

}


function dash() {

    if (
        player.dead ||
        player.dashCooldown > 0
    ) {
        return;
    }

    player.dash =
        11;

    player.dashCooldown =
        48;

    player.inv =
        Math.max(
            player.inv,
            16
        );

}


function updatePlayer() {

    if (player.dead) {

        if (pressed.KeyR) {
            location.reload();
        }

        return;

    }


    let dir = 0;


    if (
        keys.KeyA ||
        keys.ArrowLeft
    ) {
        dir -= 1;
    }


    if (
        keys.KeyD ||
        keys.ArrowRight
    ) {
        dir += 1;
    }


    if (pressed.KeyJ) {
        attack();
    }


    if (
        pressed.KeyK ||
        pressed.ShiftLeft ||
        pressed.ShiftRight
    ) {
        dash();
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


    if (player.dash > 0) {

        player.vx =
            player.facing *
            7.3;

        player.dash--;

    }
    else {

        player.vx +=
            dir *
            .52;

        player.vx =
            clamp(
                player.vx,
                -player.speed,
                player.speed
            );

        if (!dir) {
            player.vx *= .72;
        }

        if (dir) {
            player.facing =
                Math.sign(dir);
        }

    }


    player.vy +=
        .51;


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


    player.anim +=
        .07 +
        Math.abs(
            player.vx
        ) *
        .13;


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


    const target =
        player.x -
        W * .36;


    world.cameraX +=
        (
            target -
            world.cameraX
        ) *
        .07;


    world.cameraX =
        clamp(
            world.cameraX,
            0,
            WORLD_W - W
        );

}


function updateEnemies() {

    enemies.forEach(enemy => {

        if (
            !enemy.alive ||
            player.dead
        ) {
            return;
        }


        enemy.anim +=
            .06;


        if (
            enemy.hurt > 0
        ) {
            enemy.hurt--;
        }


        if (
            enemy.cooldown > 0
        ) {
            enemy.cooldown--;
        }


        const dx =
            player.x -
            enemy.x;


        enemy.facing =
            Math.sign(dx) ||
            enemy.facing;


        if (
            Math.abs(dx) <
            (
                enemy.boss
                    ? 420
                    : 300
            )
        ) {

            if (
                Math.abs(dx) >
                enemy.w * .72 &&
                enemy.hurt <= 0
            ) {

                enemy.x +=
                    Math.sign(dx) *
                    enemy.speed;

            }

        }


        if (
            overlap(
                player,
                enemy
            ) &&
            enemy.cooldown <= 0 &&
            player.inv <= 0
        ) {

            const damage =
                enemy.boss
                    ? 25
                    : enemy.type ===
                      "hunter"
                        ? 15
                        : 11;


            player.hp -=
                damage;


            player.inv =
                52;


            player.vx =
                Math.sign(
                    player.x -
                    enemy.x
                ) *
                5;


            player.vy =
                -4;


            enemy.cooldown =
                enemy.boss
                    ? 35
                    : 50;


            world.shake =
                enemy.boss
                    ? 8
                    : 5;


            burst(
                player.x +
                18,

                player.y +
                38,

                13,

                "blood"
            );


            if (
                player.hp <= 0
            ) {

                player.hp = 0;
                player.dead = true;

            }

        }

    });

}


function updateEffects() {

    particles.forEach(p => {

        p.x +=
            p.vx;

        p.y +=
            p.vy;

        p.vy +=
            .16;

        p.vx *=
            .97;

        p.life--;

    });


    for (
        let i =
            particles.length - 1;

        i >= 0;
        i--
    ) {

        if (
            particles[i].life <= 0
        ) {
            particles.splice(
                i,
                1
            );
        }

    }


    slashes.forEach(
        s =>
            s.life--
    );


    for (
        let i =
            slashes.length - 1;

        i >= 0;
        i--
    ) {

        if (
            slashes[i].life <= 0
        ) {
            slashes.splice(
                i,
                1
            );
        }

    }


    rain.forEach(drop => {

        drop.x -=
            2;

        drop.y +=
            drop.speed;


        if (
            drop.y >
            H
        ) {

            drop.y =
                -20;

            drop.x =
                Math.random() *
                W;

        }

    });


    world.shake *=
        .79;


    if (
        world.flash > 0
    ) {
        world.flash--;
    }


    world.time +=
        .016;

}


function drawMoon() {

    const x =
        438 -
        world.cameraX *
        .035;

    const y =
        68;


    ctx.fillStyle =
        "#b9949c";


    ctx.beginPath();

    ctx.arc(
        x,
        y,
        39,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#1a1522";


    ctx.beginPath();

    ctx.arc(
        x + 11,
        y - 5,
        35,
        0,
        Math.PI * 2
    );

    ctx.fill();


    rect(
        x - 27,
        y - 8,
        17,
        2,
        "#8e6e7d",
        .22
    );


    rect(
        x - 18,
        y + 13,
        24,
        2,
        "#8e6e7d",
        .18
    );

}


function drawSky() {

    const g =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );


    g.addColorStop(
        0,
        "#0b0b16"
    );

    g.addColorStop(
        .4,
        "#19162c"
    );

    g.addColorStop(
        .7,
        "#25182f"
    );

    g.addColorStop(
        1,
        "#0a080e"
    );


    ctx.fillStyle =
        g;


    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    drawMoon();

}


function drawDistantCity() {

    const px =
        world.cameraX *
        .08;


    for (
        let i = -2;
        i < 18;
        i++
    ) {

        const x =
            i * 49 -
            (
                px %
                49
            );


        const h =
            55 +
            (
                (
                    i * 29 +
                    73
                ) %
                90
            );


        rect(
            x,
            GROUND -
            h -
            55,
            39,
            h,
            "#10101b"
        );


        if (
            i % 2 === 0
        ) {

            polygon(
                [
                    [
                        x + 8,
                        GROUND -
                        h -
                        55
                    ],

                    [
                        x + 20,
                        GROUND -
                        h -
                        76
                    ],

                    [
                        x + 31,
                        GROUND -
                        h -
                        55
                    ]
                ],
                "#0d0d17"
            );

        }


        for (
            let yy =
                GROUND -
                h -
                42;

            yy <
            GROUND -
            70;

            yy += 15
        ) {

            for (
                let xx =
                    x + 7;

                xx <
                x + 34;

                xx += 12
            ) {

                if (
                    (
                        xx +
                        yy +
                        i
                    ) %
                    5 <
                    2
                ) {

                    rect(
                        xx,
                        yy,
                        2,
                        4,
                        "#8f4b55",
                        .35
                    );

                }

            }

        }

    }

}


function drawBridge() {

    const base =
        870 -
        world.cameraX *
        .17;


    line(
        base - 380,
        157,
        base + 410,
        157,
        "#26202f",
        4
    );


    const towers = [
        base - 145,
        base + 135
    ];


    towers.forEach(tx => {

        rect(
            tx,
            80,
            29,
            91,
            "#12111b"
        );


        polygon(
            [
                [tx - 5, 82],
                [tx + 14, 50],
                [tx + 34, 82]
            ],
            "#11101a"
        );


        rect(
            tx + 12,
            44,
            5,
            17,
            "#11101a"
        );


        rect(
            tx + 7,
            93,
            15,
            32,
            "#080810"
        );

    });


    for (
        let i = -130;
        i <= 130;
        i += 15
    ) {

        const bx =
            base + i;


        const sag =
            Math.abs(i) *
            .18;


        line(
            bx,
            73 + sag,
            bx,
            158,
            "#272333",
            1,
            .7
        );

    }


    ctx.strokeStyle =
        "#34283d";


    ctx.lineWidth =
        2;


    ctx.beginPath();


    ctx.moveTo(
        base - 145,
        68
    );


    ctx.quadraticCurveTo(
        base,
        148,
        base + 135,
        68
    );


    ctx.stroke();


    for (
        let i = -130;
        i <= 130;
        i += 24
    ) {

        const lx =
            base + i;


        rect(
            lx,
            144,
            2,
            2,
            "#c14b54",
            .75
        );

    }

}


function drawBrickBuilding(
    x,
    top,
    width
) {

    rect(
        x,
        top,
        width,
        GROUND - top,
        "#17131a"
    );


    for (
        let y =
            top + 4;

        y <
        GROUND;

        y += 8
    ) {

        line(
            x,
            y,
            x + width,
            y,
            "#211820",
            1,
            .7
        );

    }


    for (
        let y =
            top + 10;

        y <
        GROUND - 30;

        y += 32
    ) {

        for (
            let wx =
                x + 10;

            wx <
            x + width - 12;

            wx += 28
        ) {

            rect(
                wx,
                y,
                13,
                22,
                "#08080c"
            );


            rect(
                wx + 2,
                y + 2,
                9,
                18,
                "#b15335",
                .22
            );


            line(
                wx + 6,
                y,
                wx + 6,
                y + 22,
                "#251821"
            );

        }

    }

}


function drawNocturne() {

    const x =
        60 -
        world.cameraX;


    if (
        x < -280 ||
        x > W
    ) {
        return;
    }


    drawBrickBuilding(
        x,
        55,
        238
    );


    rect(
        x + 7,
        81,
        25,
        105,
        "#120a0d"
    );


    rect(
        x + 11,
        86,
        17,
        96,
        "#591525"
    );


    const letters =
        [
            "V",
            "O",
            "I",
            "D"
        ];


    letters.forEach(
        (c, i) => {

            text(
                c,
                x + 19,
                105 +
                i * 21,
                "#d65767",
                13,
                "center"
            );

        }
    );


    rect(
        x + 51,
        171,
        145,
        31,
        "#160a0d"
    );


    rect(
        x + 56,
        176,
        135,
        21,
        "#38131e"
    );


    text(
        "NOCTURNE",
        x + 124,
        189,
        "#d35b69",
        14,
        "center"
    );


    text(
        "BAR",
        x + 124,
        198,
        "#b74858",
        6,
        "center"
    );


    rect(
        x + 47,
        205,
        150,
        91,
        "#09090c"
    );


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        rect(
            x + 54 +
            i * 47,
            211,
            39,
            65,
            "#1e1116"
        );


        rect(
            x + 58 +
            i * 47,
            216,
            31,
            56,
            "#c45a39",
            .30
        );

    }

}


function drawForegroundArchitecture() {

    const shift =
        world.cameraX *
        .55;


    for (
        let i = -1;
        i < 8;
        i++
    ) {

        const x =
            i * 180 -
            (
                shift %
                180
            );


        const h =
            110 +
            (
                (
                    i * 27 +
                    41
                ) %
                70
            );


        rect(
            x,
            GROUND -
            h,
            155,
            h,
            "#18131a"
        );


        for (
            let yy =
                GROUND -
                h +
                20;

            yy <
            GROUND -
            25;

            yy += 35
        ) {

            for (
                let xx =
                    x + 18;

                xx <
                x + 130;

                xx += 42
            ) {

                rect(
                    xx,
                    yy,
                    16,
                    24,
                    "#07070b"
                );


                if (
                    (
                        xx +
                        yy
                    ) %
                    4 ===
                    0
                ) {

                    rect(
                        xx + 2,
                        yy + 2,
                        12,
                        20,
                        "#934c36",
                        .27
                    );

                }

            }

        }

    }

}


function drawStreet() {

    rect(
        0,
        GROUND,
        W,
        H - GROUND,
        "#08080c"
    );


    rect(
        0,
        GROUND,
        W,
        4,
        "#30242c"
    );


    for (
        let i = 0;
        i < 25;
        i++
    ) {

        const x =
            (
                i * 41 -
                world.cameraX *
                .8
            ) %
            760;


        const width =
            18 +
            (
                i % 4
            ) *
            9;


        rect(
            x,
            GROUND + 8 +
            (
                i % 4
            ) *
            9,
            width,
            2,
            "#35232e",
            .6
        );

    }


    const reflections = [

        [
            100,
            "#b32343"
        ],

        [
            218,
            "#c87343"
        ],

        [
            351,
            "#762857"
        ],

        [
            490,
            "#dc8553"
        ]

    ];


    reflections.forEach(
        ([base, color]) => {

            const x =
                (
                    base -
                    world.cameraX *
                    .7
                ) %
                730;


            for (
                let i = 0;
                i < 10;
                i++
            ) {

                rect(
                    x -
                    i * 2,
                    GROUND +
                    4 +
                    i * 5,
                    30 +
                    Math.sin(i) * 10,
                    2,
                    color,
                    .17 -
                    i * .011
                );

            }

        }
    );

}


function drawLamp(
    wx,
    glowColor
) {

    const x =
        wx -
        world.cameraX;


    if (
        x < -50 ||
        x >
        W + 50
    ) {
        return;
    }


    rect(
        x,
        157,
        5,
        141,
        "#241e20"
    );


    rect(
        x - 9,
        150,
        23,
        10,
        "#2c2221"
    );


    rect(
        x - 6,
        153,
        17,
        29,
        "#5d432f"
    );


    rect(
        x - 3,
        156,
        11,
        21,
        "#ffd28c",
        .7
    );


    const g =
        ctx.createRadialGradient(
            x + 2,
            166,
            2,
            x + 2,
            166,
            48
        );


    g.addColorStop(
        0,
        glowColor
    );


    g.addColorStop(
        1,
        "rgba(255,140,70,0)"
    );


    ctx.fillStyle =
        g;


    ctx.fillRect(
        x - 50,
        116,
        105,
        110
    );

}


function drawEnvironment() {

    drawSky();

    drawDistantCity();

    drawBridge();

    drawForegroundArchitecture();

    drawNocturne();

    drawLamp(
        1530,
        "rgba(255,168,83,.22)"
    );

    drawLamp(
        2300,
        "rgba(255,168,83,.20)"
    );

    drawStreet();

}


function drawPlayer() {

    let x =
        Math.round(
            player.x -
            world.cameraX
        );

    let y =
        Math.round(
            player.y
        );


    if (
        x < -120 ||
        x > W + 120
    ) {
        return;
    }


    const walk =
        Math.sin(
            player.anim * 2
        );


    const idle =
        Math.sin(
            player.anim *
            .7
        );


    ctx.save();


    if (
        player.facing < 0
    ) {

        ctx.translate(
            x +
            player.w / 2,
            0
        );

        ctx.scale(
            -1,
            1
        );

        ctx.translate(
            -(
                x +
                player.w / 2
            ),
            0
        );

    }


    if (
        player.inv > 0 &&
        player.inv % 8 < 4
    ) {
        ctx.globalAlpha =
            .55;
    }


    if (
        player.dash > 0
    ) {

        for (
            let i = 1;
            i < 5;
            i++
        ) {

            rect(
                x -
                i * 9,
                y + 7,
                31,
                69,
                "#7e1735",
                .10 /
                i
            );

        }

    }


    rect(
        x + 3,
        GROUND - 3,
        42,
        3,
        "#000",
        .7
    );


    const leg1 =
        Math.round(
            walk * 5
        );


    const leg2 =
        -leg1;


    rect(
        x + 12,
        y + 55,
        8,
        30 + leg1,
        "#171319"
    );


    rect(
        x + 25,
        y + 55,
        8,
        30 + leg2,
        "#171319"
    );


    rect(
        x + 8,
        y + 80 + leg1,
        14,
        8,
        "#09090d"
    );


    rect(
        x + 23,
        y + 80 + leg2,
        15,
        8,
        "#09090d"
    );


    polygon(
        [
            [x + 7, y + 32],
            [x + 37, y + 30],
            [x + 42, y + 72],
            [x + 32, y + 80],
            [x + 24, y + 62],
            [x + 9, y + 81],
            [x + 3, y + 69]
        ],
        "#111015"
    );


    polygon(
        [
            [x + 11, y + 32],
            [x + 36, y + 31],
            [x + 35, y + 61],
            [x + 25, y + 59],
            [x + 18, y + 62],
            [x + 10, y + 58]
        ],
        "#282027"
    );


    rect(
        x + 15,
        y + 29,
        19,
        34,
        "#b67e75"
    );


    polygon(
        [
            [x + 15, y + 30],
            [x + 22, y + 33],
            [x + 23, y + 62],
            [x + 14, y + 60]
        ],
        "#111015"
    );


    polygon(
        [
            [x + 34, y + 30],
            [x + 26, y + 34],
            [x + 25, y + 62],
            [x + 36, y + 59]
        ],
        "#121116"
    );


    line(
        x + 23,
        y + 32,
        x + 27,
        y + 57,
        "#5a3d41",
        1
    );


    line(
        x + 17,
        y + 42,
        x + 33,
        y + 42,
        "#9d625d",
        1,
        .4
    );


    line(
        x + 17,
        y + 50,
        x + 33,
        y + 50,
        "#9d625d",
        1,
        .4
    );


    rect(
        x + 5,
        y + 33,
        9,
        28,
        "#b97e75"
    );


    rect(
        x + 35,
        y + 33,
        9,
        28,
        "#b97e75"
    );


    rect(
        x + 6,
        y + 38,
        3,
        18,
        "#372129"
    );


    rect(
        x + 39,
        y + 39,
        3,
        17,
        "#372129"
    );


    rect(
        x + 17,
        y + 9 +
        Math.round(
            idle
        ),
        18,
        22,
        "#c08a7f"
    );


    rect(
        x + 12,
        y + 5,
        26,
        8,
        "#0b0b0f"
    );


    rect(
        x + 10,
        y + 9,
        8,
        26,
        "#0b0b0f"
    );


    rect(
        x + 33,
        y + 8,
        7,
        31,
        "#0b0b0f"
    );


    rect(
        x + 9,
        y + 18,
        5,
        28,
        "#101015"
    );


    rect(
        x + 37,
        y + 17,
        5,
        31,
        "#101015"
    );


    rect(
        x + 29,
        y + 18,
        3,
        2,
        "#d83d55"
    );


    rect(
        x + 22,
        y + 18,
        2,
        2,
        "#29171d"
    );


    line(
        x + 26,
        y + 27,
        x + 26,
        y + 40,
        "#d5b7af",
        1
    );


    line(
        x + 23,
        y + 34,
        x + 29,
        y + 34,
        "#d5b7af",
        1
    );


    if (
        player.attackTimer > 0
    ) {

        const ext =
            player.combo === 3
                ? 36
                : 28;


        rect(
            x + 34,
            y + 36,
            ext,
            8,
            "#c08b80"
        );


        rect(
            x + 58,
            y + 35,
            10,
            10,
            "#131116"
        );

    }


    ctx.restore();

}


function drawThug(
    enemy,
    x,
    y
) {

    const sway =
        Math.sin(
            enemy.anim
        );


    rect(
        x + 8,
        y + 52,
        8,
        28,
        "#20191a"
    );


    rect(
        x + 25,
        y + 52,
        8,
        28,
        "#20191a"
    );


    polygon(
        [
            [x + 4, y + 24],
            [x + 34, y + 22],
            [x + 39, y + 58],
            [x + 2, y + 58]
        ],
        enemy.hurt
            ? "#c98f8d"
            : "#4c3631"
    );


    rect(
        x + 9,
        y + 6 +
        sway,
        22,
        20,
        "#9c7469"
    );


    rect(
        x + 7,
        y + 3 +
        sway,
        26,
        8,
        "#1a1416"
    );


    rect(
        x + 27,
        y + 14 +
        sway,
        3,
        2,
        "#d85059"
    );


    rect(
        x + 31,
        y + 31,
        20,
        4,
        "#b5a08b"
    );


    polygon(
        [
            [x + 48, y + 27],
            [x + 58, y + 31],
            [x + 50, y + 39]
        ],
        "#aaa08e"
    );

}


function drawHunter(
    enemy,
    x,
    y
) {

    polygon(
        [
            [x + 2, y + 25],
            [x + 37, y + 22],
            [x + 42, y + 75],
            [x + 21, y + 66],
            [x + 1, y + 75]
        ],
        enemy.hurt
            ? "#cfb1b0"
            : "#282938"
    );


    rect(
        x + 9,
        y + 7,
        23,
        22,
        "#a7887d"
    );


    rect(
        x + 7,
        y + 3,
        28,
        8,
        "#111018"
    );


    rect(
        x + 27,
        y + 15,
        3,
        2,
        "#d7b05d"
    );


    rect(
        x + 32,
        y + 34,
        22,
        5,
        "#827c75"
    );


    rect(
        x + 50,
        y + 29,
        5,
        14,
        "#39363a"
    );

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
        x + 13,
        y + 70,
        13,
        39,
        "#171317"
    );


    rect(
        x + 39,
        y + 70,
        13,
        39,
        "#171317"
    );


    polygon(
        [
            [x + 5, y + 30],
            [x + 57, y + 27],
            [x + 63, y + 79],
            [x + 1, y + 82]
        ],
        enemy.hurt
            ? "#d6a4a0"
            : "#65323b"
    );


    rect(
        x + 14,
        y + 5 + pulse,
        38,
        28,
        "#aa7b73"
    );


    rect(
        x + 10,
        y + 2 + pulse,
        45,
        10,
        "#20171b"
    );


    rect(
        x + 43,
        y + 15 + pulse,
        4,
        3,
        "#ef394e"
    );


    rect(
        x + 53,
        y + 40,
        43,
        8,
        "#423a38"
    );


    polygon(
        [
            [x + 90, y + 31],
            [x + 113, y + 42],
            [x + 94, y + 58]
        ],
        "#8d8680"
    );

}


function drawEnemy(enemy) {

    if (!enemy.alive) {
        return;
    }


    const x =
        Math.round(
            enemy.x -
            world.cameraX
        );


    const y =
        enemy.y;


    if (
        x < -140 ||
        x > W + 140
    ) {
        return;
    }


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


    if (
        enemy.type ===
        "thug"
    ) {

        drawThug(
            enemy,
            x,
            y
        );

    }


    if (
        enemy.type ===
        "hunter"
    ) {

        drawHunter(
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


    ctx.restore();

}


function drawSlashes() {

    slashes.forEach(s => {

        const x =
            s.x -
            world.cameraX;


        const alpha =
            s.life /
            s.maxLife;


        ctx.save();


        ctx.globalAlpha =
            alpha;


        ctx.strokeStyle =
            s.combo === 3
                ? "#f12e55"
                : "#d8415d";


        ctx.lineWidth =
            s.combo === 3
                ? 8
                : 5;


        ctx.beginPath();


        if (
            s.facing > 0
        ) {

            ctx.arc(
                x + 12,
                s.y,
                s.combo === 3
                    ? 47
                    : 36,
                -.85,
                .67
            );

        }
        else {

            ctx.arc(
                x - 12,
                s.y,
                s.combo === 3
                    ? 47
                    : 36,
                Math.PI - .67,
                Math.PI + .85
            );

        }


        ctx.stroke();


        ctx.globalAlpha =
            alpha * .45;


        ctx.strokeStyle =
            "#ff9ba7";


        ctx.lineWidth =
            2;


        ctx.stroke();


        ctx.restore();

    });

}


function drawParticles() {

    particles.forEach(p => {

        const x =
            p.x -
            world.cameraX;


        const a =
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
            p.type === "blood"
                ? "#c21434"
                : "#ffbd75",
            a
        );

    });

}


function drawRain() {

    ctx.strokeStyle =
        "rgba(164,159,194,.28)";


    ctx.lineWidth =
        1;


    ctx.beginPath();


    rain.forEach(drop => {

        ctx.moveTo(
            drop.x,
            drop.y
        );


        ctx.lineTo(
            drop.x - 3,
            drop.y + drop.len
        );

    });


    ctx.stroke();

}


function drawHud() {

    rect(
        10,
        12,
        195,
        58,
        "#050509",
        .82
    );


    text(
        "NIGHT BLOOD",
        18,
        28,
        "#be2840",
        15
    );


    text(
        "THE STRAY",
        88,
        43,
        "#d1c1c6",
        7
    );


    text(
        "CAITIFF",
        88,
        54,
        "#89717c",
        6
    );


    text(
        `HP ${player.hp}/${player.maxHp}`,
        88,
        22,
        "#ded0d4",
        7
    );


    rect(
        88,
        28,
        103,
        7,
        "#2b1219"
    );


    rect(
        88,
        28,
        103 *
        (
            player.hp /
            player.maxHp
        ),
        7,
        "#b5223e"
    );


    rect(
        88,
        59,
        103,
        3,
        "#1c1624"
    );


    rect(
        88,
        59,
        103 *
        (
            1 -
            player.dashCooldown /
            48
        ),
        3,
        "#6b4a91"
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
        ) < 560
    ) {

        rect(
            W / 2 - 180,
            H - 35,
            360,
            23,
            "#050507",
            .90
        );


        text(
            "THE BUTCHER",
            W / 2,
            H - 26,
            "#d8c4c7",
            8,
            "center"
        );


        rect(
            W / 2 - 150,
            H - 20,
            300,
            5,
            "#2c1017"
        );


        rect(
            W / 2 - 150,
            H - 20,
            300 *
            (
                boss.hp /
                boss.maxHp
            ),
            5,
            "#b32239"
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
            .80
        );


        text(
            "THE NIGHT CLAIMS YOU",
            W / 2,
            H / 2,
            "#ddd0d3",
            18,
            "center"
        );


        text(
            "PRESS R",
            W / 2,
            H / 2 + 22,
            "#8d7078",
            8,
            "center"
        );

    }

}


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
        k =>
            delete pressed[k]
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

    drawPlayer();

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
            "#ffe5eb",
            .05
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
