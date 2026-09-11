"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;

const WORLD_W = 2200;
const GROUND = 229;

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
    cameraX: 0,
    shake: 0,
    hitStop: 0,
    flash: 0,
    time: 0,
    fog: 0
};


const player = {
    x: 74,
    y: 177,

    w: 24,
    h: 52,

    vx: 0,
    vy: 0,

    speed: 2.45,
    jumpPower: 7.7,

    grounded: false,
    facing: 1,

    hp: 120,
    maxHp: 120,

    inv: 0,

    attackTimer: 0,
    attackCooldown: 0,

    combo: 0,
    comboWindow: 0,

    dash: 0,
    dashCooldown: 0,

    anim: 0,
    state: "idle",

    dead: false
};


const enemyData = [
    ["thug", 385, 38],
    ["thug", 615, 44],
    ["hunter", 870, 58],
    ["thug", 1185, 48],
    ["hunter", 1380, 60],
    ["boss", 1775, 230]
];


const enemies = enemyData.map(([type, x, hp]) => ({
    type,

    x,

    y:
        type === "boss"
            ? GROUND - 69
            : type === "hunter"
                ? GROUND - 48
                : GROUND - 42,

    w:
        type === "boss"
            ? 43
            : type === "hunter"
                ? 25
                : 23,

    h:
        type === "boss"
            ? 69
            : type === "hunter"
                ? 48
                : 42,

    hp,
    maxHp: hp,

    speed:
        type === "boss"
            ? 0.54
            : type === "hunter"
                ? 0.76
                : 0.68,

    alive: true,

    facing: -1,

    hurt: 0,

    cooldown: 0,

    anim: Math.random() * 10,

    boss: type === "boss"
}));


const particles = [];
const slashes = [];


const rain = Array.from(
    { length: 105 },
    () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        speed: 3 + Math.random() * 4,
        len: 3 + Math.random() * 5
    })
);


function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}


function overlap(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}


function rect(x, y, w, h, color, alpha = 1) {
    const old = ctx.globalAlpha;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;

    ctx.fillRect(
        Math.round(x),
        Math.round(y),
        Math.round(w),
        Math.round(h)
    );

    ctx.globalAlpha = old;
}


function poly(points, color, alpha = 1) {
    const old = ctx.globalAlpha;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;

    ctx.beginPath();

    ctx.moveTo(
        Math.round(points[0][0]),
        Math.round(points[0][1])
    );

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(
            Math.round(points[i][0]),
            Math.round(points[i][1])
        );
    }

    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = old;
}


function text(
    value,
    x,
    y,
    color = "#ddd",
    size = 8,
    align = "left"
) {
    ctx.textAlign = align;
    ctx.font = `${size}px monospace`;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
    ctx.textAlign = "left";
}


function particleBurst(
    x,
    y,
    count,
    type = "blood"
) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,

            vx:
                (Math.random() - 0.5) *
                (
                    type === "spark"
                        ? 4.4
                        : 3.5
                ),

            vy:
                -Math.random() *
                (
                    type === "spark"
                        ? 4.3
                        : 3.2
                ),

            life:
                12 +
                Math.random() * 20,

            type,

            size:
                type === "fog"
                    ? 5 + Math.random() * 8
                    : 1 + Math.random() * 1.5
        });
    }
}


function slashEffect(x, y, combo, facing) {
    slashes.push({
        x,
        y,
        combo,
        facing,
        life: 7,
        maxLife: 7
    });
}


function attackBox() {
    const reach =
        player.combo === 3
            ? 42
            : 34;

    return {
        x:
            player.facing > 0
                ? player.x + player.w - 3
                : player.x - reach + 3,

        y: player.y + 8,

        w: reach,
        h: 36
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

    player.comboWindow = 22;

    player.attackTimer =
        player.combo === 3
            ? 14
            : 10;

    player.attackCooldown =
        player.combo === 3
            ? 17
            : 11;

    slashEffect(
        player.x + player.w / 2,
        player.y + 22,
        player.combo,
        player.facing
    );

    const hit = attackBox();

    enemies.forEach(enemy => {
        if (
            !enemy.alive ||
            !overlap(hit, enemy)
        ) {
            return;
        }

        let damage =
            player.combo === 3
                ? 36
                : player.combo === 2
                    ? 25
                    : 20;

        if (enemy.boss) {
            damage = Math.floor(damage * 0.72);
        }

        enemy.hp -= damage;
        enemy.hurt = 9;

        enemy.x +=
            player.facing *
            (
                player.combo === 3
                    ? 18
                    : 10
            );

        world.hitStop =
            player.combo === 3
                ? 5
                : 3;

        world.shake =
            player.combo === 3
                ? 5
                : 3;

        world.flash = 2;

        particleBurst(
            enemy.x + enemy.w / 2,
            enemy.y + enemy.h / 2,
            player.combo === 3
                ? 14
                : 8,
            "blood"
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
                25,
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

    player.dash = 9;
    player.dashCooldown = 40;
    player.inv = Math.max(player.inv, 13);

    particleBurst(
        player.x + player.w / 2,
        player.y + player.h - 3,
        8,
        "fog"
    );
}


function resetGame() {
    Object.assign(player, {
        x: 74,
        y: 177,

        vx: 0,
        vy: 0,

        hp: 120,

        dead: false,

        combo: 0,
        comboWindow: 0,

        attackTimer: 0,
        attackCooldown: 0,

        dash: 0,
        dashCooldown: 0,

        inv: 0
    });

    enemyData.forEach(
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
    slashes.length = 0;
}


function updatePlayer() {
    if (player.dead) {
        if (pressed.KeyR) {
            resetGame();
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
        player.vy = -player.jumpPower;
        player.grounded = false;
    }

    if (player.dash > 0) {
        player.vx =
            player.facing *
            6.2;

        player.dash--;
    }
    else {
        player.vx += dir * 0.38;

        player.vx =
            clamp(
                player.vx,
                -player.speed,
                player.speed
            );

        if (!dir) {
            player.vx *= 0.74;
        }

        if (dir) {
            player.facing = Math.sign(dir);
        }
    }

    player.vy += 0.38;

    player.x += player.vx;
    player.y += player.vy;

    if (
        player.y + player.h >=
        GROUND
    ) {
        player.y =
            GROUND -
            player.h;

        player.vy = 0;
        player.grounded = true;
    }

    player.x =
        clamp(
            player.x,
            10,
            WORLD_W - 40
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

    if (player.dashCooldown > 0) {
        player.dashCooldown--;
    }

    if (player.inv > 0) {
        player.inv--;
    }

    player.anim +=
        0.06 +
        Math.abs(player.vx) *
        0.11;

    if (!player.grounded) {
        player.state =
            player.vy < 0
                ? "jump"
                : "fall";
    }
    else if (player.attackTimer > 0) {
        player.state = "attack";
    }
    else if (player.dash > 0) {
        player.state = "dash";
    }
    else if (Math.abs(player.vx) > 0.4) {
        player.state = "walk";
    }
    else {
        player.state = "idle";
    }

    const target =
        player.x -
        W * 0.34;

    world.cameraX +=
        (target - world.cameraX) *
        0.08;

    world.cameraX =
        clamp(
            world.cameraX,
            0,
            WORLD_W - W
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

        enemy.anim += 0.045;

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

        const detection =
            enemy.boss
                ? 310
                : 220;

        if (
            Math.abs(dx) < detection &&
            Math.abs(dx) > enemy.w * 0.7 &&
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
                        ? 5
                        : 3.5
                );

            player.vy = -3;

            enemy.cooldown =
                enemy.boss
                    ? 38
                    : 50;

            world.shake =
                enemy.boss
                    ? 6
                    : 3;

            particleBurst(
                player.x + 12,
                player.y + 22,
                8,
                "blood"
            );

            if (player.hp <= 0) {
                player.hp = 0;
                player.dead = true;
            }
        }
    });
}


function updateEffects() {
    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.type === "fog") {
            p.vy -= 0.005;
            p.vx *= 0.95;
        }
        else {
            p.vy += 0.14;
            p.vx *= 0.97;
        }

        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    for (
        let i = slashes.length - 1;
        i >= 0;
        i--
    ) {
        slashes[i].life--;

        if (slashes[i].life <= 0) {
            slashes.splice(i, 1);
        }
    }

    rain.forEach(drop => {
        drop.x -= 0.9;
        drop.y += drop.speed;

        if (drop.y > H + 8) {
            drop.y = -8;
            drop.x = Math.random() * W;
        }
    });

    if (world.shake > 0) {
        world.shake *= 0.75;
    }

    if (world.flash > 0) {
        world.flash--;
    }

    world.time += 0.016;
    world.fog += 0.003;
}


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
        "#080812"
    );

    gradient.addColorStop(
        0.42,
        "#17121c"
    );

    gradient.addColorStop(
        0.78,
        "#271720"
    );

    gradient.addColorStop(
        1,
        "#160d13"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    const moonX =
        392 -
        world.cameraX * 0.025;

    const moonY = 39;

    ctx.fillStyle = "#bbb3ae";

    ctx.beginPath();

    ctx.arc(
        moonX,
        moonY,
        20,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#0e0d15";

    ctx.beginPath();

    ctx.arc(
        moonX + 8,
        moonY - 5,
        18,
        0,
        Math.PI * 2
    );

    ctx.fill();


    rect(
        moonX - 42,
        moonY + 21,
        95,
        2,
        "#725d66",
        0.12
    );
}


function drawFarCity() {
    const parallax =
        world.cameraX * 0.09;

    for (
        let i = -2;
        i < 12;
        i++
    ) {
        const x =
            i * 56 -
            (parallax % 56);

        const h =
            48 +
            (
                (i * 17 + 37) %
                63
            );

        rect(
            x,
            GROUND - h - 37,
            45,
            h,
            "#11131b"
        );

        if (i % 3 === 0) {
            rect(
                x + 20,
                GROUND - h - 46,
                5,
                9,
                "#10121a"
            );
        }

        for (
            let wy =
                GROUND - h - 26;

            wy <
            GROUND - 52;

            wy += 11
        ) {
            for (
                let wx =
                    x + 7;

                wx <
                x + 39;

                wx += 11
            ) {
                if (
                    (
                        Math.floor(wx + wy + i)
                        % 5
                    ) === 0
                ) {
                    rect(
                        wx,
                        wy,
                        2,
                        3,
                        "#5b4650",
                        0.6
                    );
                }
            }
        }
    }
}


function drawCathedral() {
    const x =
        880 -
        world.cameraX * 0.18;

    if (
        x < -300 ||
        x > W + 300
    ) {
        return;
    }

    rect(
        x,
        72,
        84,
        119,
        "#17141c"
    );

    rect(
        x + 28,
        38,
        28,
        153,
        "#16131b"
    );

    poly(
        [
            [x + 25, 39],
            [x + 42, 14],
            [x + 59, 39]
        ],
        "#15121a"
    );

    rect(
        x + 40,
        11,
        4,
        11,
        "#15121a"
    );

    rect(
        x + 36,
        15,
        12,
        3,
        "#15121a"
    );

    for (
        let yy = 64;
        yy < 170;
        yy += 24
    ) {
        rect(
            x + 37,
            yy,
            10,
            18,
            "#08080d"
        );

        rect(
            x + 39,
            yy + 2,
            6,
            14,
            "#392536",
            0.48
        );
    }
}


function drawMidBuildings() {
    const shift =
        world.cameraX * 0.42;

    for (
        let i = -1;
        i < 9;
        i++
    ) {
        const x =
            i * 112 -
            (shift % 112);

        const h =
            82 +
            (
                (i * 31 + 23) %
                72
            );

        rect(
            x,
            GROUND - h,
            101,
            h,
            i % 2
                ? "#211921"
                : "#1d171e"
        );

        rect(
            x + 3,
            GROUND - h + 5,
            95,
            3,
            "#32232b"
        );

        for (
            let yy =
                GROUND - h + 17;

            yy <
            GROUND - 24;

            yy += 22
        ) {
            for (
                let xx =
                    x + 12;

                xx <
                x + 88;

                xx += 28
            ) {
                rect(
                    xx,
                    yy,
                    9,
                    12,
                    "#0c0c12"
                );

                if (
                    (
                        Math.floor(
                            xx + yy + i
                        )
                        % 4
                    ) === 0
                ) {
                    rect(
                        xx + 2,
                        yy + 2,
                        5,
                        8,
                        "#61444c",
                        0.42
                    );
                }
            }
        }

        if (i % 2 === 0) {
            for (
                let yy =
                    GROUND - h + 28;

                yy <
                GROUND - 40;

                yy += 31
            ) {
                rect(
                    x + 76,
                    yy,
                    28,
                    2,
                    "#4b3b42"
                );

                rect(
                    x + 95,
                    yy,
                    2,
                    20,
                    "#44343b"
                );

                rect(
                    x + 79,
                    yy,
                    2,
                    13,
                    "#44343b"
                );
            }
        }
    }
}


function storefront(
    worldX,
    width,
    label,
    signColor,
    windowColor
) {
    const x =
        worldX -
        world.cameraX;

    if (
        x > W + 80 ||
        x + width < -80
    ) {
        return;
    }

    rect(
        x,
        143,
        width,
        GROUND - 143,
        "#211920"
    );

    rect(
        x + 3,
        149,
        width - 6,
        3,
        "#39272f"
    );

    rect(
        x + 12,
        183,
        31,
        46,
        "#0b0b0e"
    );

    rect(
        x + 16,
        187,
        23,
        37,
        windowColor,
        0.22
    );

    rect(
        x + 49,
        171,
        width - 57,
        25,
        "#0d0c10"
    );

    rect(
        x + 53,
        175,
        width - 65,
        17,
        signColor
    );

    text(
        label,
        x + width / 2,
        187,
        "#e0c9cd",
        8,
        "center"
    );


    rect(
        x + 53,
        GROUND + 2,
        width - 65,
        22,
        signColor,
        0.08
    );

    rect(
        x + 57,
        GROUND + 2,
        width - 73,
        12,
        signColor,
        0.06
    );
}


function drawStreetDetails() {
    storefront(
        125,
        190,
        "VIDEO / VHS",
        "#66223e",
        "#30233d"
    );

    storefront(
        470,
        210,
        "VOID",
        "#452c65",
        "#28224b"
    );

    storefront(
        810,
        240,
        "24 HOUR DELI",
        "#765525",
        "#58441f"
    );

    storefront(
        1180,
        260,
        "NOCTURNE",
        "#711c45",
        "#391d36"
    );

    storefront(
        1695,
        315,
        "THE PIT",
        "#711d29",
        "#4f1724"
    );


    for (
        let wx = 340;
        wx < WORLD_W;
        wx += 310
    ) {
        const x =
            wx -
            world.cameraX;

        rect(
            x,
            164,
            3,
            65,
            "#302932"
        );

        rect(
            x - 2,
            162,
            25,
            3,
            "#51424a"
        );

        rect(
            x + 18,
            165,
            6,
            6,
            "#756169"
        );

        rect(
            x + 19,
            171,
            4,
            16,
            "#44343d",
            0.45
        );
    }


    const hydrants = [
        715,
        1100,
        1570,
        2050
    ];

    hydrants.forEach(wx => {
        const x =
            wx -
            world.cameraX;

        rect(
            x,
            GROUND - 13,
            5,
            13,
            "#55222c"
        );

        rect(
            x - 2,
            GROUND - 11,
            9,
            3,
            "#672936"
        );

        rect(
            x - 1,
            GROUND - 15,
            7,
            3,
            "#672936"
        );
    });
}


function drawGround() {
    rect(
        0,
        GROUND,
        W,
        H - GROUND,
        "#111015"
    );

    rect(
        0,
        GROUND,
        W,
        3,
        "#34272e"
    );

    for (
        let i = 0;
        i < 22;
        i++
    ) {
        const x =
            (
                i * 41 -
                world.cameraX * 0.7
            ) %
            520;

        rect(
            x,
            GROUND + 11 + (i % 3) * 7,
            18 + (i % 4) * 5,
            1,
            "#2d2429",
            0.7
        );
    }

    for (
        let i = 0;
        i < 8;
        i++
    ) {
        const x =
            (
                i * 89 -
                world.cameraX * 0.8
            ) %
            560;

        rect(
            x,
            GROUND + 4,
            26,
            7,
            "#1e1820",
            0.78
        );

        rect(
            x + 5,
            GROUND + 5,
            15,
            1,
            "#73515d",
            0.22
        );
    }
}


function drawFog() {
    for (
        let i = 0;
        i < 13;
        i++
    ) {
        const x =
            (
                i * 54 +
                Math.sin(
                    world.fog +
                    i
                ) * 22 -
                world.cameraX * 0.11
            ) %
            650;

        rect(
            x,
            GROUND - 15 + (i % 4) * 4,
            60 + (i % 5) * 10,
            4,
            "#817482",
            0.035
        );
    }
}


function drawBackground() {
    drawSky();
    drawFarCity();
    drawCathedral();
    drawMidBuildings();
    drawStreetDetails();
    drawGround();
    drawFog();
}


function drawCoat(
    x,
    y,
    swing = 0
) {
    poly(
        [
            [x + 6, y + 20],
            [x + 18, y + 20],
            [x + 21, y + 45],
            [x + 17 + swing, y + 51],
            [x + 12, y + 43],
            [x + 6 - swing, y + 51],
            [x + 3, y + 44]
        ],
        "#17131b"
    );

    rect(
        x + 7,
        y + 21,
        10,
        25,
        "#211922"
    );

    rect(
        x + 8,
        y + 22,
        2,
        22,
        "#4d2838"
    );
}


function drawPlayer() {
    let x =
        Math.round(
            player.x -
            world.cameraX
        );

    let y =
        Math.round(player.y);

    if (
        x < -80 ||
        x > W + 80
    ) {
        return;
    }

    const walk =
        player.state === "walk"
            ? Math.sin(
                player.anim * 2.1
            )
            : 0;

    const breathe =
        player.state === "idle"
            ? Math.round(
                Math.sin(
                    player.anim * 0.8
                )
            )
            : 0;

    const coatSwing =
        Math.round(
            Math.sin(
                player.anim * 1.4
            ) * 2
        );


    ctx.save();

    if (
        player.inv > 0 &&
        player.inv % 8 < 4
    ) {
        ctx.globalAlpha = 0.48;
    }


    if (player.facing < 0) {
        ctx.translate(
            x + player.w / 2,
            0
        );

        ctx.scale(-1, 1);

        ctx.translate(
            -(x + player.w / 2),
            0
        );
    }


    rect(
        x + 3,
        GROUND - 2,
        22,
        2,
        "#020204",
        0.55
    );


    if (player.dash > 0) {
        rect(
            x - 10,
            y + 7,
            18,
            37,
            "#6d1e3c",
            0.15
        );

        rect(
            x - 18,
            y + 12,
            14,
            29,
            "#732443",
            0.08
        );
    }


    drawCoat(
        x,
        y + breathe,
        coatSwing
    );


    const legShift =
        Math.round(
            walk * 2.2
        );


    rect(
        x + 6,
        y + 37,
        5,
        11 + legShift,
        "#17141a"
    );

    rect(
        x + 14,
        y + 37,
        5,
        11 - legShift,
        "#17141a"
    );


    rect(
        x + 4,
        y + 47 + legShift,
        8,
        5,
        "#0b0a0d"
    );

    rect(
        x + 13,
        y + 47 - legShift,
        8,
        5,
        "#0b0a0d"
    );


    rect(
        x + 5,
        y + 17 + breathe,
        15,
        22,
        "#b7a19e"
    );


    rect(
        x + 7,
        y + 17 + breathe,
        11,
        22,
        "#1b171d"
    );


    rect(
        x + 7,
        y + 19 + breathe,
        2,
        14,
        "#663147"
    );

    rect(
        x + 16,
        y + 19 + breathe,
        1,
        13,
        "#4d293d"
    );


    rect(
        x + 1,
        y + 20 + breathe,
        5,
        15,
        "#bda7a2"
    );

    rect(
        x + 19,
        y + 20 + breathe,
        5,
        15,
        "#bda7a2"
    );


    rect(
        x + 2,
        y + 23 + breathe,
        2,
        2,
        "#32232e"
    );

    rect(
        x + 2,
        y + 28 + breathe,
        3,
        1,
        "#32232e"
    );

    rect(
        x + 20,
        y + 24 + breathe,
        2,
        2,
        "#32232e"
    );

    rect(
        x + 20,
        y + 29 + breathe,
        3,
        1,
        "#32232e"
    );


    rect(
        x + 7,
        y + 4 + breathe,
        11,
        13,
        "#c7b4af"
    );

    rect(
        x + 6,
        y + 2 + breathe,
        13,
        5,
        "#141118"
    );

    rect(
        x + 5,
        y + 5 + breathe,
        4,
        8,
        "#141118"
    );

    rect(
        x + 17,
        y + 4 + breathe,
        3,
        6,
        "#141118"
    );


    rect(
        x + 14,
        y + 10 + breathe,
        2,
        1,
        "#d52b47"
    );

    rect(
        x + 13,
        y + 13 + breathe,
        3,
        1,
        "#775057"
    );


    if (
        player.attackTimer > 0
    ) {
        if (player.combo === 1) {
            rect(
                x + 18,
                y + 21,
                17,
                5,
                "#c5aca7"
            );

            rect(
                x + 31,
                y + 20,
                6,
                7,
                "#18131a"
            );
        }

        if (player.combo === 2) {
            rect(
                x + 18,
                y + 17,
                14,
                5,
                "#c5aca7"
            );

            rect(
                x + 29,
                y + 12,
                6,
                10,
                "#18131a"
            );

            rect(
                x + 7,
                y + 34,
                24,
                3,
                "#6c263d"
            );
        }

        if (player.combo === 3) {
            rect(
                x + 18,
                y + 23,
                22,
                6,
                "#c5aca7"
            );

            rect(
                x + 36,
                y + 20,
                7,
                10,
                "#18131a"
            );

            rect(
                x + 10,
                y + 13,
                3,
                27,
                "#8a2941"
            );
        }
    }


    ctx.restore();
}


function drawThug(enemy, x, y) {
    const bounce =
        Math.round(
            Math.sin(
                enemy.anim * 2
            )
        );

    rect(
        x + 5,
        y + 25,
        5,
        17,
        "#17171a"
    );

    rect(
        x + 14,
        y + 25,
        5,
        17,
        "#17171a"
    );

    rect(
        x + 3,
        y + 13 + bounce,
        18,
        22,
        enemy.hurt
            ? "#d0b4b4"
            : "#43504b"
    );

    rect(
        x + 5,
        y + 15 + bounce,
        14,
        4,
        "#27312e"
    );

    rect(
        x + 6,
        y + 3 + bounce,
        12,
        11,
        "#9b8581"
    );

    rect(
        x + 8,
        y + bounce,
        7,
        4,
        "#1c1519"
    );

    rect(
        x + 11,
        y - 3 + bounce,
        2,
        4,
        "#711d32"
    );

    rect(
        x + 15,
        y + 8 + bounce,
        2,
        1,
        "#c05058"
    );

    rect(
        x + 19,
        y + 19 + bounce,
        11,
        2,
        "#6d6256"
    );

    rect(
        x + 27,
        y + 17 + bounce,
        2,
        8,
        "#3a3430"
    );
}


function drawHunter(enemy, x, y) {
    const sway =
        Math.round(
            Math.sin(enemy.anim) * 1
        );

    poly(
        [
            [x + 5, y + 17],
            [x + 21, y + 17],
            [x + 24, y + 46],
            [x + 14, y + 40],
            [x + 3, y + 46]
        ],
        enemy.hurt
            ? "#d3c1c3"
            : "#414252"
    );

    rect(
        x + 6,
        y + 31,
        5,
        17,
        "#17171d"
    );

    rect(
        x + 16,
        y + 31,
        5,
        17,
        "#17171d"
    );

    rect(
        x + 7,
        y + 5 + sway,
        13,
        12,
        "#b4a5a0"
    );

    rect(
        x + 5,
        y + 3 + sway,
        17,
        4,
        "#1a1720"
    );

    rect(
        x + 9,
        y + sway,
        9,
        4,
        "#1a1720"
    );

    rect(
        x + 16,
        y + 10 + sway,
        2,
        1,
        "#d7a564"
    );

    rect(
        x + 20,
        y + 20 + sway,
        15,
        3,
        "#8c826d"
    );

    rect(
        x + 31,
        y + 17 + sway,
        4,
        8,
        "#332e31"
    );
}


function drawBoss(enemy, x, y) {
    const pulse =
        Math.round(
            Math.sin(
                enemy.anim * 1.3
            )
        );

    rect(
        x + 8,
        y + 43,
        10,
        26,
        "#171318"
    );

    rect(
        x + 26,
        y + 43,
        10,
        26,
        "#171318"
    );


    rect(
        x + 3,
        y + 18 + pulse,
        37,
        38,
        enemy.hurt
            ? "#d2afb0"
            : "#713744"
    );

    rect(
        x,
        y + 24 + pulse,
        8,
        29,
        "#8f4852"
    );

    rect(
        x + 37,
        y + 24 + pulse,
        8,
        29,
        "#8f4852"
    );


    rect(
        x + 9,
        y + 4 + pulse,
        26,
        17,
        "#b8a29d"
    );

    rect(
        x + 8,
        y + 2 + pulse,
        28,
        8,
        "#292126"
    );


    rect(
        x + 12,
        y + 8 + pulse,
        19,
        9,
        "#d6c3bd"
    );

    rect(
        x + 15,
        y + 11 + pulse,
        3,
        2,
        "#2d292a"
    );

    rect(
        x + 27,
        y + 11 + pulse,
        3,
        2,
        "#dc3347"
    );


    rect(
        x + 39,
        y + 28 + pulse,
        23,
        5,
        "#4c4440"
    );

    poly(
        [
            [x + 57, y + 22],
            [x + 69, y + 28],
            [x + 61, y + 39],
            [x + 52, y + 34]
        ],
        "#8a8178"
    );

    rect(
        x + 10,
        y + 28 + pulse,
        20,
        3,
        "#9d4c57"
    );

    rect(
        x + 11,
        y + 34 + pulse,
        18,
        2,
        "#54212e"
    );
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
        Math.round(enemy.y);

    if (
        x < -100 ||
        x > W + 100
    ) {
        return;
    }

    ctx.save();

    if (enemy.facing < 0) {
        ctx.translate(
            x + enemy.w / 2,
            0
        );

        ctx.scale(-1, 1);

        ctx.translate(
            -(x + enemy.w / 2),
            0
        );
    }

    rect(
        x + 2,
        GROUND - 2,
        enemy.w,
        2,
        "#020204",
        0.5
    );

    if (enemy.type === "thug") {
        drawThug(
            enemy,
            x,
            y
        );
    }

    if (enemy.type === "hunter") {
        drawHunter(
            enemy,
            x,
            y
        );
    }

    if (enemy.type === "boss") {
        drawBoss(
            enemy,
            x,
            y
        );
    }

    ctx.restore();


    rect(
        x,
        y - 7,
        enemy.w,
        2,
        "#160b0f"
    );

    rect(
        x,
        y - 7,
        enemy.w *
        clamp(
            enemy.hp /
            enemy.maxHp,
            0,
            1
        ),
        2,
        enemy.boss
            ? "#b0253d"
            : "#74505b"
    );
}


function drawSlashes() {
    slashes.forEach(slash => {
        const x =
            slash.x -
            world.cameraX;

        const alpha =
            slash.life /
            slash.maxLife;

        ctx.save();

        ctx.globalAlpha =
            alpha * 0.8;

        ctx.strokeStyle =
            slash.combo === 3
                ? "#d34561"
                : "#bba6ae";

        ctx.lineWidth =
            slash.combo === 3
                ? 4
                : 2;

        ctx.beginPath();

        if (slash.facing > 0) {
            ctx.arc(
                x,
                slash.y,
                slash.combo === 3
                    ? 28
                    : 22,
                -0.9,
                0.65
            );
        }
        else {
            ctx.arc(
                x,
                slash.y,
                slash.combo === 3
                    ? 28
                    : 22,
                Math.PI - 0.65,
                Math.PI + 0.9
            );
        }

        ctx.stroke();

        ctx.restore();
    });
}


function drawParticles() {
    particles.forEach(p => {
        const x =
            p.x -
            world.cameraX;

        const alpha =
            clamp(
                p.life / 24,
                0,
                1
            );

        if (p.type === "blood") {
            rect(
                x,
                p.y,
                p.size,
                p.size,
                "#9e1f36",
                alpha
            );
        }

        if (p.type === "spark") {
            rect(
                x,
                p.y,
                1,
                1,
                "#d8b86f",
                alpha
            );
        }

        if (p.type === "fog") {
            rect(
                x,
                p.y,
                p.size,
                2,
                "#776a78",
                alpha * 0.08
            );
        }
    });
}


function drawRain() {
    ctx.strokeStyle =
        "rgba(161,170,192,.23)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    rain.forEach(drop => {
        ctx.moveTo(
            drop.x,
            drop.y
        );

        ctx.lineTo(
            drop.x - 2,
            drop.y + drop.len
        );
    });

    ctx.stroke();
}


function drawHud() {
    rect(
        8,
        8,
        151,
        34,
        "#050507",
        0.82
    );

    text(
        "THE STRAY",
        15,
        19,
        "#e0d4d7",
        8
    );

    text(
        "CAITIFF • BROOKLYN 1996",
        15,
        27,
        "#806a72",
        5
    );

    rect(
        15,
        32,
        126,
        5,
        "#251219"
    );

    rect(
        15,
        32,
        126 *
        (
            player.hp /
            player.maxHp
        ),
        5,
        "#9f263d"
    );

    rect(
        15,
        38,
        126 *
        (
            1 -
            player.dashCooldown /
            40
        ),
        1,
        "#604e75",
        0.85
    );


    if (
        player.combo > 0 &&
        player.comboWindow > 0
    ) {
        text(
            `COMBO ${player.combo}`,
            169,
            21,
            "#bca5ad",
            7
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
        ) < 380
    ) {
        rect(
            W / 2 - 116,
            H - 32,
            232,
            19,
            "#050507",
            0.86
        );

        text(
            "THE BUTCHER",
            W / 2,
            H - 23,
            "#d6c5c8",
            7,
            "center"
        );

        rect(
            W / 2 - 94,
            H - 19,
            188,
            4,
            "#251016"
        );

        rect(
            W / 2 - 94,
            H - 19,
            188 *
            (
                boss.hp /
                boss.maxHp
            ),
            4,
            "#a52238"
        );
    }


    if (player.dead) {
        rect(
            0,
            0,
            W,
            H,
            "#000000",
            0.75
        );

        text(
            "THE NIGHT CLAIMS YOU",
            W / 2,
            H / 2,
            "#d9c8cb",
            18,
            "center"
        );

        text(
            "PRESS R TO RISE AGAIN",
            W / 2,
            H / 2 + 18,
            "#886c75",
            7,
            "center"
        );
    }


    if (
        enemies.every(
            enemy =>
                !enemy.alive
        ) &&
        !player.dead
    ) {
        rect(
            W / 2 - 135,
            79,
            270,
            72,
            "#050507",
            0.85
        );

        text(
            "NIGHT BLOOD",
            W / 2,
            104,
            "#e3d5d7",
            17,
            "center"
        );

        text(
            "VISUAL PASS I COMPLETE",
            W / 2,
            121,
            "#a67d89",
            8,
            "center"
        );

        text(
            "THE NIGHT IS ONLY BEGINNING",
            W / 2,
            137,
            "#715963",
            6,
            "center"
        );
    }
}


function update() {
    if (world.hitStop > 0) {
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

    Object.keys(
        pressed
    ).forEach(
        key =>
            delete pressed[key]
    );
}


function draw() {
    ctx.save();

    if (world.shake > 0) {
        ctx.translate(
            (
                Math.random() - 0.5
            ) *
            world.shake,

            (
                Math.random() - 0.5
            ) *
            world.shake
        );
    }

    drawBackground();

    enemies.forEach(
        drawEnemy
    );

    drawPlayer();

    drawSlashes();
    drawParticles();
    drawRain();

    ctx.restore();

    drawHud();

    if (world.flash > 0) {
        rect(
            0,
            0,
            W,
            H,
            "#f2dce1",
            0.06
        );
    }
}


function loop() {
    update();
    draw();

    requestAnimationFrame(loop);
}


loop();
