"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const keys = {};
const pressed = {};

addEventListener("keydown", e => {

    if (!keys[e.code]) {
        pressed[e.code] = true;
    }

    keys[e.code] = true;

    if (
        e.code === "Space" ||
        e.code === "ArrowUp" ||
        e.code === "ArrowLeft" ||
        e.code === "ArrowRight"
    ) {
        e.preventDefault();
    }
});

addEventListener("keyup", e => {
    keys[e.code] = false;
});


const world = {

    width: 4300,

    ground: 458,

    gravity: 0.72,

    cameraX: 0,

    shake: 0,

    flash: 0,

    hitStop: 0
};


const player = {

    x: 140,
    y: 350,

    w: 46,
    h: 96,

    vx: 0,
    vy: 0,

    speed: 4.4,
    jump: 14.2,

    facing: 1,

    grounded: false,

    hp: 120,
    maxHp: 120,

    inv: 0,

    dead: false,

    attackTimer: 0,
    attackCooldown: 0,

    combo: 0,
    comboWindow: 0,

    dash: 0,
    dashCd: 0,

    anim: 0
};


const enemyDefinitions = [

    ["thug",   760,  38, 1.25],

    ["thug",  1220,  44, 1.35],

    ["hunter",1770,  58, 1.55],

    ["thug",  2360,  48, 1.45],

    ["hunter",2730,  60, 1.55],

    ["boss",  3470, 210, 1.05]
];


const enemies = enemyDefinitions.map(
    ([type, x, hp, speed]) => ({

        type,

        x,

        y:
            type === "boss"
                ? 338
                : type === "hunter"
                    ? 378
                    : 392,

        w:
            type === "boss"
                ? 76
                : type === "hunter"
                    ? 48
                    : 44,

        h:
            type === "boss"
                ? 120
                : type === "hunter"
                    ? 78
                    : 66,

        hp,
        maxHp: hp,

        speed,

        alive: true,

        hurt: 0,

        cooldown: 0,

        facing: -1,

        boss: type === "boss"
    })
);


const particles = [];


const rain = Array.from(
    { length: 130 },
    () => ({

        x: Math.random() * WIDTH,

        y: Math.random() * HEIGHT,

        speed:
            7 +
            Math.random() * 8,

        len:
            8 +
            Math.random() * 11
    })
);


function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );
}


function overlap(a, b) {

    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}


function pixelRect(
    x,
    y,
    width,
    height,
    color
) {

    ctx.fillStyle = color;

    ctx.fillRect(
        Math.round(x),
        Math.round(y),
        Math.round(width),
        Math.round(height)
    );
}


function particleBurst(
    x,
    y,
    amount,
    type = "blood"
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
                (Math.random() - 0.5) *
                (
                    type === "spark"
                        ? 8
                        : 6
                ),

            vy:
                -Math.random() *
                (
                    type === "spark"
                        ? 7
                        : 5
                ),

            life:
                18 +
                Math.random() * 22,

            maxLife: 40,

            type
        });
    }
}


function playerAttackBox() {

    const reach =
        player.combo === 3
            ? 76
            : 62;

    return {

        x:
            player.facing > 0
                ? player.x + player.w - 4
                : player.x - reach + 4,

        y:
            player.y + 17,

        w: reach,

        h: 63
    };
}


function attack() {

    if (
        player.attackCooldown > 0 ||
        player.dead
    ) {
        return;
    }

    player.combo =
        player.comboWindow > 0
            ? player.combo % 3 + 1
            : 1;

    player.comboWindow = 24;

    player.attackTimer =
        player.combo === 3
            ? 15
            : 11;

    player.attackCooldown =
        player.combo === 3
            ? 18
            : 12;

    const hit = playerAttackBox();

    enemies.forEach(enemy => {

        if (
            !enemy.alive ||
            !overlap(hit, enemy)
        ) {
            return;
        }

        const baseDamage =
            player.combo === 3
                ? 34
                : player.combo === 2
                    ? 24
                    : 20;

        const damage =
            enemy.boss
                ? Math.floor(
                    baseDamage * 0.72
                )
                : baseDamage;

        enemy.hp -= damage;

        enemy.hurt = 10;

        enemy.x +=
            player.facing *
            (
                player.combo === 3
                    ? 34
                    : 18
            );

        world.shake =
            player.combo === 3
                ? 9
                : 5;

        world.flash = 3;

        world.hitStop =
            player.combo === 3
                ? 5
                : 3;

        particleBurst(
            enemy.x + enemy.w / 2,
            enemy.y + enemy.h / 2,
            player.combo === 3
                ? 14
                : 8
        );

        particleBurst(
            enemy.x + enemy.w / 2,
            enemy.y + enemy.h / 2,
            4,
            "spark"
        );

        if (enemy.hp <= 0) {

            enemy.alive = false;

            particleBurst(
                enemy.x + enemy.w / 2,
                enemy.y + enemy.h / 2,
                18
            );
        }
    });
}


function dash() {

    if (
        player.dashCd > 0 ||
        player.dead
    ) {
        return;
    }

    player.dash = 9;

    player.dashCd = 42;

    player.inv =
        Math.max(
            player.inv,
            12
        );

    particleBurst(
        player.x + player.w / 2,
        player.y + player.h * 0.8,
        7,
        "smoke"
    );
}


function resetGame() {

    Object.assign(
        player,
        {
            x: 140,
            y: 350,

            vx: 0,
            vy: 0,

            hp: 120,

            inv: 0,

            dead: false,

            attackTimer: 0,

            attackCooldown: 0,

            combo: 0,

            comboWindow: 0,

            dash: 0,

            dashCd: 0
        }
    );

    enemyDefinitions.forEach(
        ([type, x, hp], index) => {

            Object.assign(
                enemies[index],
                {
                    x,

                    hp,

                    maxHp: hp,

                    alive: true,

                    hurt: 0,

                    cooldown: 0
                }
            );
        }
    );

    world.cameraX = 0;

    particles.length = 0;
}


function updatePlayer() {

    if (player.dead) {

        if (pressed.KeyR) {
            resetGame();
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

    if (pressed.KeyJ) {
        attack();
    }

    if (
        pressed.KeyK ||
        pressed.ShiftLeft
    ) {
        dash();
    }

    if (player.dash > 0) {

        player.vx =
            player.facing *
            11.5;

        player.dash--;
    }

    else {

        player.vx +=
            direction * 0.7;

        player.vx =
            clamp(
                player.vx,
                -player.speed,
                player.speed
            );

        if (!direction) {
            player.vx *= 0.76;
        }

        if (direction) {
            player.facing =
                Math.sign(direction);
        }
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
            -player.jump;

        player.grounded = false;
    }

    player.vy +=
        world.gravity;

    player.x +=
        player.vx;

    player.y +=
        player.vy;

    if (
        player.y +
        player.h >=
        world.ground
    ) {

        player.y =
            world.ground -
            player.h;

        player.vy = 0;

        player.grounded = true;
    }

    player.x =
        clamp(
            player.x,
            24,
            world.width -
            player.w -
            24
        );

    if (player.attackTimer > 0) {
        player.attackTimer--;
    }

    if (player.attackCooldown > 0) {
        player.attackCooldown--;
    }

    if (player.comboWindow > 0) {
        player.comboWindow--;
    }

    else {
        player.combo = 0;
    }

    if (player.inv > 0) {
        player.inv--;
    }

    if (player.dashCd > 0) {
        player.dashCd--;
    }

    player.anim +=
        Math.abs(player.vx) *
        0.08 +
        0.02;

    const cameraTarget =
        player.x -
        WIDTH * 0.34;

    world.cameraX +=
        (
            cameraTarget -
            world.cameraX
        ) *
        0.09;

    world.cameraX =
        clamp(
            world.cameraX,
            0,
            world.width -
            WIDTH
        );
}


function updateEnemies() {

    if (player.dead) {
        return;
    }

    enemies.forEach(enemy => {

        if (!enemy.alive) {
            return;
        }

        if (enemy.hurt > 0) {
            enemy.hurt--;
        }

        if (enemy.cooldown > 0) {
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
                    ? 600
                    : 460
            ) &&
            Math.abs(dx) >
            enemy.w * 0.7 &&
            enemy.hurt <= 0
        ) {

            enemy.x +=
                Math.sign(dx) *
                enemy.speed;
        }

        if (
            overlap(player, enemy) &&
            enemy.cooldown <= 0 &&
            player.inv <= 0
        ) {

            const damage =
                enemy.boss
                    ? 24
                    : enemy.type === "hunter"
                        ? 15
                        : 11;

            player.hp -= damage;

            player.inv = 48;

            player.vx =
                Math.sign(
                    player.x -
                    enemy.x
                ) *
                (
                    enemy.boss
                        ? 10
                        : 7
                );

            player.vy = -5;

            enemy.cooldown =
                enemy.boss
                    ? 42
                    : 52;

            world.shake =
                enemy.boss
                    ? 10
                    : 6;

            world.flash = 2;

            particleBurst(
                player.x +
                player.w / 2,

                player.y + 45,

                7
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

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];

        particle.x +=
            particle.vx;

        particle.y +=
            particle.vy;

        particle.vy +=
            particle.type === "smoke"
                ? -0.01
                : 0.25;

        particle.vx *=
            0.97;

        particle.life--;

        if (
            particle.life <= 0
        ) {

            particles.splice(
                i,
                1
            );
        }
    }

    rain.forEach(drop => {

        drop.x -= 1.8;

        drop.y +=
            drop.speed;

        if (
            drop.y >
            HEIGHT + 20
        ) {

            drop.y = -20;

            drop.x =
                Math.random() *
                WIDTH;
        }
    });
}


function drawSkyline(
    parallax,
    color,
    baseHeight,
    spacing
) {

    const offset =
        (
            world.cameraX *
            parallax
        ) %
        spacing;

    for (
        let i = -2;
        i < 10;
        i++
    ) {

        const x =
            i *
            spacing -
            offset;

        const height =
            baseHeight +
            (
                (
                    i * 53 +
                    90
                ) %
                120
            );

        pixelRect(
            x,
            world.ground -
            height,
            spacing - 22,
            height,
            color
        );

        for (
            let y =
                world.ground -
                height +
                24;

            y <
            world.ground -
            28;

            y += 34
        ) {

            for (
                let wx =
                    x + 14;

                wx <
                x +
                spacing -
                36;

                wx += 29
            ) {

                if (
                    Math.floor(
                        wx +
                        y +
                        i
                    ) %
                    4 !==
                    0
                ) {

                    pixelRect(
                        wx,
                        y,
                        6,
                        10,
                        "#4a3c3d"
                    );
                }
            }
        }
    }
}


function drawStreet() {

    const offset =
        -world.cameraX;

    const shops = [

        [
            240,
            360,
            "VIDEO / VHS",
            "#5b263f"
        ],

        [
            900,
            440,
            "VOID",
            "#52294a"
        ],

        [
            1600,
            420,
            "24 HOUR DELI",
            "#4d3d25"
        ],

        [
            2330,
            520,
            "NOCTURNE",
            "#4b2034"
        ],

        [
            3180,
            650,
            "THE PIT",
            "#5a232a"
        ]
    ];

    shops.forEach(
        (
            [
                shopX,
                shopWidth,
                label,
                signColor
            ]
        ) => {

            const x =
                shopX +
                offset;

            if (
                x >
                WIDTH + 100 ||
                x +
                shopWidth <
                -100
            ) {
                return;
            }

            pixelRect(
                x,
                205,
                shopWidth,
                253,
                "#241d25"
            );

            pixelRect(
                x + 10,
                218,
                shopWidth - 20,
                8,
                "#3c3037"
            );

            pixelRect(
                x + 36,
                278,
                105,
                180,
                "#0b0b10"
            );

            pixelRect(
                x + 175,
                252,
                142,
                35,
                signColor
            );

            ctx.font =
                "bold 16px monospace";

            ctx.fillStyle =
                "#d4b8bf";

            ctx.fillText(
                label,
                x + 185,
                276
            );

            for (
                let wx =
                    x + 170;

                wx <
                x +
                shopWidth -
                40;

                wx += 62
            ) {

                pixelRect(
                    wx,
                    320,
                    34,
                    54,
                    "#101017"
                );

                pixelRect(
                    wx + 4,
                    326,
                    26,
                    4,
                    "#47343d"
                );
            }
        }
    );

    for (
        let x = 460;
        x < world.width;
        x += 560
    ) {

        const screenX =
            x +
            offset;

        pixelRect(
            screenX,
            320,
            8,
            138,
            "#2a252d"
        );

        pixelRect(
            screenX - 4,
            318,
            57,
            5,
            "#66525b"
        );
    }

    pixelRect(
        0,
        world.ground,
        WIDTH,
        HEIGHT -
        world.ground,
        "#17151a"
    );

    pixelRect(
        0,
        world.ground,
        WIDTH,
        7,
        "#30252d"
    );
}


function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            HEIGHT
        );

    gradient.addColorStop(
        0,
        "#070812"
    );

    gradient.addColorStop(
        0.55,
        "#11101b"
    );

    gradient.addColorStop(
        1,
        "#21151a"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    const moonX =
        780 -
        world.cameraX *
        0.05;

    ctx.fillStyle =
        "#b8afb4";

    ctx.beginPath();

    ctx.arc(
        moonX,
        80,
        38,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#0c0d16";

    ctx.beginPath();

    ctx.arc(
        moonX + 15,
        68,
        35,
        0,
        Math.PI * 2
    );

    ctx.fill();

    drawSkyline(
        0.1,
        "#10121a",
        135,
        120
    );

    drawSkyline(
        0.2,
        "#171722",
        205,
        145
    );

    drawSkyline(
        0.34,
        "#211a23",
        260,
        180
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

    y +=
        player.grounded
            ? Math.sin(
                player.anim * 2
            ) *
            (
                Math.abs(
                    player.vx
                ) >
                0.7
                    ? 2
                    : 1
            )
            : 0;

    ctx.save();

    if (
        player.inv > 0 &&
        player.inv % 8 < 4
    ) {

        ctx.globalAlpha =
            0.45;
    }

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


    pixelRect(
        x + 3,
        world.ground - 6,
        44,
        6,
        "#050507"
    );


    const walkSwing =
        Math.round(
            Math.sin(
                player.anim * 1.7
            ) *
            3
        );


    pixelRect(
        x + 5,
        y + 42,
        9,
        41 +
        walkSwing,
        "#18131b"
    );

    pixelRect(
        x + 31,
        y + 42,
        9,
        41 -
        walkSwing,
        "#18131b"
    );


    pixelRect(
        x + 4,
        y + 73,
        14,
        23,
        "#111015"
    );

    pixelRect(
        x + 27,
        y + 73,
        14,
        23,
        "#111015"
    );


    pixelRect(
        x + 7,
        y + 58,
        11,
        23,
        "#29222b"
    );

    pixelRect(
        x + 27,
        y + 58,
        11,
        23,
        "#29222b"
    );


    pixelRect(
        x + 6,
        y + 26,
        34,
        36,
        "#b19a96"
    );


    pixelRect(
        x + 11,
        y + 24,
        24,
        39,
        "#1a171d"
    );


    pixelRect(
        x - 2,
        y + 31,
        11,
        31,
        "#bca5a0"
    );

    pixelRect(
        x + 36,
        y + 31,
        11,
        31,
        "#bca5a0"
    );


    pixelRect(
        x,
        y + 38,
        7,
        3,
        "#3a2d39"
    );

    pixelRect(
        x + 38,
        y + 39,
        7,
        3,
        "#3a2d39"
    );


    pixelRect(
        x + 11,
        y + 3,
        24,
        24,
        "#c9b5b0"
    );


    pixelRect(
        x + 8,
        y,
        30,
        9,
        "#151218"
    );

    pixelRect(
        x + 7,
        y + 6,
        6,
        20,
        "#151218"
    );


    pixelRect(
        x + 28,
        y + 13,
        4,
        3,
        "#d2253d"
    );


    if (
        player.attackTimer > 0
    ) {

        if (
            player.combo === 1
        ) {

            pixelRect(
                x + 37,
                y + 31,
                35,
                11,
                "#c7afaa"
            );

            pixelRect(
                x + 68,
                y + 29,
                12,
                15,
                "#151217"
            );
        }

        else if (
            player.combo === 2
        ) {

            pixelRect(
                x + 38,
                y + 25,
                28,
                10,
                "#c7afaa"
            );

            pixelRect(
                x + 62,
                y + 18,
                13,
                22,
                "#151217"
            );

            pixelRect(
                x + 9,
                y + 64,
                51,
                8,
                "#6e3140"
            );
        }

        else {

            pixelRect(
                x + 35,
                y + 36,
                42,
                13,
                "#c7afaa"
            );

            pixelRect(
                x + 72,
                y + 32,
                13,
                18,
                "#151217"
            );

            pixelRect(
                x + 20,
                y + 16,
                6,
                52,
                "#79263a"
            );
        }
    }


    if (
        player.dash > 0
    ) {

        ctx.globalAlpha =
            0.25;

        pixelRect(
            x - 26,
            y + 15,
            34,
            68,
            "#8d263f"
        );

        pixelRect(
            x - 45,
            y + 25,
            22,
            52,
            "#5d1f36"
        );
    }

    ctx.restore();
}


function drawEnemy(enemy) {

    if (!enemy.alive) {
        return;
    }

    let x =
        Math.round(
            enemy.x -
            world.cameraX
        );

    const y =
        Math.round(
            enemy.y
        );

    if (
        x < -120 ||
        x >
        WIDTH + 120
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


    const bodyColor =
        enemy.hurt > 0
            ? "#d7c1bf"
            : enemy.boss
                ? "#713440"
                : enemy.type === "hunter"
                    ? "#5f6172"
                    : "#59645f";


    pixelRect(
        x + 5,
        y + 20,
        enemy.w - 10,
        enemy.h - 20,
        bodyColor
    );


    pixelRect(
        x + 9,
        y,
        enemy.w - 18,
        24,
        "#211a21"
    );


    pixelRect(
        x +
        enemy.w -
        14,
        y + 10,
        4,
        3,
        enemy.boss
            ? "#ff304c"
            : "#cf6b72"
    );


    pixelRect(
        x,
        y +
        enemy.h -
        13,
        enemy.w,
        13,
        "#121116"
    );


    if (enemy.boss) {

        pixelRect(
            x - 9,
            y + 24,
            12,
            58,
            "#8c4249"
        );

        pixelRect(
            x +
            enemy.w -
            3,
            y + 24,
            12,
            58,
            "#8c4249"
        );
    }

    else if (
        enemy.type === "hunter"
    ) {

        pixelRect(
            x +
            enemy.w -
            5,
            y + 32,
            18,
            5,
            "#b6a37c"
        );
    }


    pixelRect(
        x,
        y - 11,
        enemy.w,
        4,
        "#181318"
    );

    pixelRect(
        x,
        y - 11,
        enemy.w *
        clamp(
            enemy.hp /
            enemy.maxHp,
            0,
            1
        ),
        4,
        enemy.boss
            ? "#a92f3e"
            : "#7f5861"
    );


    ctx.restore();
}


function drawEffects() {

    particles.forEach(
        particle => {

            const x =
                particle.x -
                world.cameraX;

            ctx.globalAlpha =
                clamp(
                    particle.life /
                    particle.maxLife,
                    0,
                    1
                );

            const color =
                particle.type === "blood"
                    ? "#a51e35"
                    : particle.type === "spark"
                        ? "#d6b97a"
                        : "#5d5060";

            pixelRect(
                x,
                particle.y,
                particle.type === "spark"
                    ? 2
                    : 3,
                particle.type === "smoke"
                    ? 5
                    : 3,
                color
            );

            ctx.globalAlpha = 1;
        }
    );


    ctx.strokeStyle =
        "rgba(170,180,210,.24)";

    ctx.beginPath();

    rain.forEach(drop => {

        ctx.moveTo(
            drop.x,
            drop.y
        );

        ctx.lineTo(
            drop.x - 4,
            drop.y +
            drop.len
        );
    });

    ctx.stroke();
}


function drawHud() {

    pixelRect(
        18,
        16,
        315,
        68,
        "rgba(4,4,7,.78)"
    );


    ctx.fillStyle =
        "#eadfe2";

    ctx.font =
        "bold 17px monospace";

    ctx.fillText(
        "THE STRAY",
        31,
        40
    );


    ctx.font =
        "12px monospace";

    ctx.fillStyle =
        "#8e7c86";

    ctx.fillText(
        "Caitiff • Brooklyn, 1996",
        31,
        57
    );


    pixelRect(
        31,
        66,
        260,
        9,
        "#24131a"
    );

    pixelRect(
        31,
        66,
        260 *
        (
            player.hp /
            player.maxHp
        ),
        9,
        "#96263a"
    );


    if (
        player.combo > 0 &&
        player.comboWindow > 0
    ) {

        ctx.fillStyle =
            "#c9a7b2";

        ctx.font =
            "bold 13px monospace";

        ctx.fillText(
            `COMBO ${player.combo}/3`,
            346,
            40
        );
    }


    const boss =
        enemies.find(
            enemy =>
                enemy.boss &&
                enemy.alive
        );


    if (
        boss &&
        Math.abs(
            boss.x -
            player.x
        ) <
        720
    ) {

        pixelRect(
            WIDTH / 2 - 235,
            HEIGHT - 64,
            470,
            41,
            "rgba(4,4,7,.84)"
        );

        ctx.textAlign =
            "center";

        ctx.fillStyle =
            "#dfd0d2";

        ctx.font =
            "bold 14px monospace";

        ctx.fillText(
            "THE BUTCHER",
            WIDTH / 2,
            HEIGHT - 46
        );

        pixelRect(
            WIDTH / 2 - 190,
            HEIGHT - 38,
            380,
            7,
            "#2b1419"
        );

        pixelRect(
            WIDTH / 2 - 190,
            HEIGHT - 38,
            380 *
            (
                boss.hp /
                boss.maxHp
            ),
            7,
            "#9d2836"
        );

        ctx.textAlign =
            "left";
    }


    if (player.dead) {

        pixelRect(
            0,
            0,
            WIDTH,
            HEIGHT,
            "rgba(0,0,0,.74)"
        );

        ctx.textAlign =
            "center";

        ctx.fillStyle =
            "#d7c9cc";

        ctx.font =
            "bold 38px monospace";

        ctx.fillText(
            "THE NIGHT CLAIMS YOU",
            WIDTH / 2,
            HEIGHT / 2
        );

        ctx.font =
            "18px monospace";

        ctx.fillText(
            "Press R to rise again",
            WIDTH / 2,
            HEIGHT / 2 + 42
        );

        ctx.textAlign =
            "left";
    }


    if (
        enemies.every(
            enemy =>
                !enemy.alive
        ) &&
        !player.dead
    ) {

        pixelRect(
            WIDTH / 2 - 250,
            166,
            500,
            130,
            "rgba(0,0,0,.78)"
        );

        ctx.textAlign =
            "center";

        ctx.fillStyle =
            "#e1d4d6";

        ctx.font =
            "bold 30px monospace";

        ctx.fillText(
            "PROTOTYPE 0.2 COMPLETE",
            WIDTH / 2,
            215
        );

        ctx.font =
            "16px monospace";

        ctx.fillText(
            "Brooklyn survives. For now.",
            WIDTH / 2,
            252
        );

        ctx.textAlign =
            "left";
    }
}


function update() {

    if (
        world.hitStop > 0
    ) {

        world.hitStop--;

        Object.keys(
            pressed
        ).forEach(
            key =>
                delete pressed[key]
        );

        return;
    }

    updatePlayer();

    updateEnemies();

    updateEffects();


    if (
        world.shake > 0
    ) {

        world.shake *=
            0.78;
    }


    if (
        world.flash > 0
    ) {

        world.flash--;
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
        world.shake > 0
    ) {

        ctx.translate(
            (
                Math.random() -
                0.5
            ) *
            world.shake,

            (
                Math.random() -
                0.5
            ) *
            world.shake
        );
    }


    drawBackground();


    enemies.forEach(
        drawEnemy
    );


    drawPlayer();


    drawEffects();


    ctx.restore();


    drawHud();


    if (
        world.flash > 0
    ) {

        pixelRect(
            0,
            0,
            WIDTH,
            HEIGHT,
            "rgba(255,220,225,.06)"
        );
    }
}


function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );
}


gameLoop();
