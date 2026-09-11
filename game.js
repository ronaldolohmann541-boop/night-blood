"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const keys = {};

addEventListener("keydown", e => {
    keys[e.code] = true;

    if (
        e.code === "Space" ||
        e.code === "ArrowUp"
    ) {
        e.preventDefault();
    }
});

addEventListener("keyup", e => {
    keys[e.code] = false;
});

const world = {
    gravity: 0.72,
    ground: 455,
    cameraX: 0,
    width: 3900
};

const player = {
    x: 180,
    y: 340,

    w: 44,
    h: 92,

    vx: 0,
    vy: 0,

    speed: 4.1,
    jump: 14,

    facing: 1,

    grounded: false,

    hp: 100,
    maxHp: 100,

    attackTimer: 0,
    attackCooldown: 0,

    hurtTimer: 0,

    dead: false
};

const enemies = [

    {
        type: "thug",
        x: 770,
        y: 391,
        w: 42,
        h: 64,
        hp: 35,
        maxHp: 35,
        speed: 1.25,
        color: "#657069",
        alive: true,
        hurt: 0
    },

    {
        type: "thug",
        x: 1230,
        y: 391,
        w: 42,
        h: 64,
        hp: 35,
        maxHp: 35,
        speed: 1.35,
        color: "#6f5e64",
        alive: true,
        hurt: 0
    },

    {
        type: "hunter",
        x: 1740,
        y: 381,
        w: 45,
        h: 74,
        hp: 50,
        maxHp: 50,
        speed: 1.5,
        color: "#6d6b78",
        alive: true,
        hurt: 0
    },

    {
        type: "thug",
        x: 2350,
        y: 391,
        w: 42,
        h: 64,
        hp: 40,
        maxHp: 40,
        speed: 1.45,
        color: "#67675d",
        alive: true,
        hurt: 0
    },

    {
        type: "boss",
        x: 3190,
        y: 346,
        w: 70,
        h: 109,
        hp: 160,
        maxHp: 160,
        speed: 1.05,
        color: "#542d32",
        alive: true,
        hurt: 0,
        boss: true
    }

];

const rain = [];

for (let i = 0; i < 110; i++) {
    rain.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        speed: 6 + Math.random() * 8,
        len: 7 + Math.random() * 12
    });
}

function rectsOverlap(a, b) {

    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

function attackBox() {

    const reach = 58;

    return {
        x:
            player.facing === 1
                ? player.x + player.w - 5
                : player.x - reach + 5,

        y: player.y + 17,

        w: reach,
        h: 56
    };
}

function resetGame() {

    player.x = 180;
    player.y = 340;

    player.vx = 0;
    player.vy = 0;

    player.hp = 100;
    player.dead = false;

    world.cameraX = 0;

    const setup = [
        [770, 35],
        [1230, 35],
        [1740, 50],
        [2350, 40],
        [3190, 160]
    ];

    enemies.forEach((enemy, i) => {

        enemy.x = setup[i][0];
        enemy.hp = setup[i][1];

        enemy.alive = true;
        enemy.hurt = 0;
    });
}

function updatePlayer() {

    if (player.dead) {

        if (keys["KeyR"]) {
            resetGame();
        }

        return;
    }

    let direction = 0;

    if (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    ) {
        direction -= 1;
    }

    if (
        keys["KeyD"] ||
        keys["ArrowRight"]
    ) {
        direction += 1;
    }

    player.vx += direction * 0.65;

    const maxSpeed =
        keys["ShiftLeft"]
            ? player.speed * 1.45
            : player.speed;

    player.vx = Math.max(
        -maxSpeed,
        Math.min(maxSpeed, player.vx)
    );

    if (direction === 0) {
        player.vx *= 0.77;
    }

    if (direction !== 0) {
        player.facing = Math.sign(direction);
    }

    if (
        (
            keys["Space"] ||
            keys["KeyW"] ||
            keys["ArrowUp"]
        ) &&
        player.grounded
    ) {

        player.vy = -player.jump;
        player.grounded = false;
    }

    player.vy += world.gravity;

    player.x += player.vx;
    player.y += player.vy;

    if (
        player.y + player.h >= world.ground
    ) {

        player.y = world.ground - player.h;

        player.vy = 0;
        player.grounded = true;
    }

    player.x = Math.max(
        30,
        Math.min(
            world.width - player.w - 30,
            player.x
        )
    );

    if (player.attackCooldown > 0) {
        player.attackCooldown--;
    }

    if (player.attackTimer > 0) {
        player.attackTimer--;
    }

    if (player.hurtTimer > 0) {
        player.hurtTimer--;
    }

    if (
        keys["KeyJ"] &&
        player.attackCooldown <= 0
    ) {

        player.attackTimer = 12;
        player.attackCooldown = 25;

        const hit = attackBox();

        enemies.forEach(enemy => {

            if (
                enemy.alive &&
                rectsOverlap(hit, enemy)
            ) {

                const damage =
                    enemy.boss
                        ? 20
                        : 26;

                enemy.hp -= damage;

                enemy.hurt = 8;

                enemy.x += player.facing * 25;

                if (enemy.hp <= 0) {
                    enemy.alive = false;
                }
            }
        });
    }

    const cameraTarget =
        player.x - WIDTH * 0.36;

    world.cameraX +=
        (cameraTarget - world.cameraX) * 0.08;

    world.cameraX = Math.max(
        0,
        Math.min(
            world.width - WIDTH,
            world.cameraX
        )
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

        const dx =
            player.x - enemy.x;

        if (Math.abs(dx) < 450) {

            const dir =
                Math.sign(dx);

            enemy.x +=
                dir * enemy.speed;
        }

        const danger = {
            x: enemy.x,
            y: enemy.y,
            w: enemy.w,
            h: enemy.h
        };

        if (
            rectsOverlap(player, danger) &&
            player.hurtTimer <= 0
        ) {

            player.hp -=
                enemy.boss
                    ? 20
                    : 11;

            player.hurtTimer = 55;

            player.vx =
                Math.sign(player.x - enemy.x) * 8;

            player.vy = -6;

            if (player.hp <= 0) {

                player.hp = 0;
                player.dead = true;
            }
        }
    });
}

function updateRain() {

    rain.forEach(drop => {

        drop.x -= 1.6;
        drop.y += drop.speed;

        if (drop.y > HEIGHT) {

            drop.y = -20;
            drop.x =
                Math.random() * WIDTH;
        }
    });
}

function drawBackground() {

    ctx.fillStyle = "#080910";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const moonX =
        760 - world.cameraX * 0.05;

    ctx.fillStyle = "#b9b0af";

    ctx.beginPath();

    ctx.arc(
        moonX,
        90,
        44,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#101017";

    ctx.beginPath();

    ctx.arc(
        moonX + 18,
        76,
        39,
        0,
        Math.PI * 2
    );

    ctx.fill();

    drawSkyline(0.12, "#11131a", 140);
    drawSkyline(0.25, "#17171d", 220);

    ctx.fillStyle = "#171419";

    ctx.fillRect(
        0,
        world.ground,
        WIDTH,
        HEIGHT - world.ground
    );

    ctx.fillStyle = "#232127";

    ctx.fillRect(
        0,
        world.ground,
        WIDTH,
        7
    );

    drawStreet();
}

function drawSkyline(parallax, color, base) {

    ctx.fillStyle = color;

    for (let i = -2; i < 15; i++) {

        const bx =
            i * 130 -
            (world.cameraX * parallax % 130);

        const h =
            base +
            ((i * 41) % 120);

        ctx.fillRect(
            bx,
            world.ground - h,
            104,
            h
        );

        ctx.fillStyle = "#3d3532";

        for (
            let y = world.ground - h + 25;
            y < world.ground - 30;
            y += 35
        ) {

            for (
                let x = bx + 14;
                x < bx + 90;
                x += 28
            ) {

                if (
                    (x + y + i) % 3 !== 0
                ) {
                    ctx.fillRect(
                        x,
                        y,
                        7,
                        11
                    );
                }
            }
        }

        ctx.fillStyle = color;
    }
}

function drawStreet() {

    const offset =
        -world.cameraX;

    const buildings = [

        {
            x: 310,
            w: 330,
            label: "VIDEO"
        },

        {
            x: 1010,
            w: 420,
            label: "VOID"
        },

        {
            x: 1890,
            w: 400,
            label: "24H"
        },

        {
            x: 2700,
            w: 560,
            label: "THE PIT"
        }
    ];

    buildings.forEach(b => {

        const x =
            b.x + offset;

        if (
            x + b.w < -100 ||
            x > WIDTH + 100
        ) {
            return;
        }

        ctx.fillStyle = "#201c21";

        ctx.fillRect(
            x,
            205,
            b.w,
            250
        );

        ctx.fillStyle = "#302932";

        ctx.fillRect(
            x + 18,
            240,
            b.w - 36,
            8
        );

        ctx.fillStyle = "#0d0d10";

        ctx.fillRect(
            x + 45,
            290,
            100,
            165
        );

        ctx.fillStyle = "#4d2734";

        ctx.fillRect(
            x + 180,
            260,
            110,
            32
        );

        ctx.fillStyle = "#b38a91";

        ctx.font =
            "bold 17px monospace";

        ctx.fillText(
            b.label,
            x + 194,
            282
        );
    });

    for (
        let x = 400;
        x < world.width;
        x += 520
    ) {

        const sx =
            x + offset;

        ctx.fillStyle = "#252128";

        ctx.fillRect(
            sx,
            320,
            8,
            135
        );

        ctx.fillStyle = "#65515b";

        ctx.fillRect(
            sx - 4,
            318,
            55,
            5
        );

        ctx.fillStyle = "#79525c";

        ctx.fillRect(
            sx + 39,
            323,
            12,
            8
        );
    }

    ctx.fillStyle = "#09090b";

    for (
        let x = 0;
        x < world.width;
        x += 180
    ) {

        const sx =
            x + offset;

        ctx.fillRect(
            sx,
            485,
            110,
            7
        );
    }
}

function drawPlayer() {

    const x =
        Math.round(
            player.x - world.cameraX
        );

    const y =
        Math.round(player.y);

    ctx.save();

    if (
        player.hurtTimer > 0 &&
        player.hurtTimer % 8 < 4
    ) {
        ctx.globalAlpha = 0.45;
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

    // shadow
    ctx.fillStyle = "#050506";

    ctx.fillRect(
        x + 3,
        world.ground - 7,
        42,
        7
    );

    // boots
    ctx.fillStyle = "#171419";

    ctx.fillRect(
        x + 5,
        y + 72,
        13,
        20
    );

    ctx.fillRect(
        x + 25,
        y + 72,
        13,
        20
    );

    // legs
    ctx.fillStyle = "#252128";

    ctx.fillRect(
        x + 7,
        y + 51,
        12,
        28
    );

    ctx.fillRect(
        x + 25,
        y + 51,
        12,
        28
    );

    // torso
    ctx.fillStyle = "#343038";

    ctx.fillRect(
        x + 5,
        y + 25,
        34,
        35
    );

    // leather vest
    ctx.fillStyle = "#17151a";

    ctx.fillRect(
        x + 10,
        y + 25,
        24,
        34
    );

    // arms
    ctx.fillStyle = "#b8a6a4";

    ctx.fillRect(
        x,
        y + 29,
        9,
        30
    );

    ctx.fillRect(
        x + 36,
        y + 29,
        9,
        30
    );

    // tattoos
    ctx.fillStyle = "#29252d";

    ctx.fillRect(
        x + 1,
        y + 36,
        7,
        3
    );

    ctx.fillRect(
        x + 37,
        y + 41,
        7,
        3
    );

    // head
    ctx.fillStyle = "#c4b2ae";

    ctx.fillRect(
        x + 11,
        y + 3,
        24,
        24
    );

    // hair
    ctx.fillStyle = "#17151a";

    ctx.fillRect(
        x + 9,
        y,
        28,
        9
    );

    ctx.fillRect(
        x + 8,
        y + 5,
        5,
        15
    );

    // eye
    ctx.fillStyle = "#b81832";

    ctx.fillRect(
        x + 28,
        y + 13,
        4,
        3
    );

    if (player.attackTimer > 0) {

        ctx.fillStyle = "#c2b2b1";

        ctx.fillRect(
            x + 39,
            y + 34,
            32,
            10
        );

        ctx.fillStyle = "#1c161b";

        ctx.fillRect(
            x + 66,
            y + 32,
            12,
            14
        );
    }

    ctx.restore();
}

function drawEnemy(enemy) {

    if (!enemy.alive) {
        return;
    }

    const x =
        Math.round(
            enemy.x - world.cameraX
        );

    const y =
        Math.round(enemy.y);

    if (
        x < -100 ||
        x > WIDTH + 100
    ) {
        return;
    }

    ctx.fillStyle =
        enemy.hurt > 0
            ? "#d0b9ba"
            : enemy.color;

    ctx.fillRect(
        x + 5,
        y + 20,
        enemy.w - 10,
        enemy.h - 20
    );

    ctx.fillStyle = "#211c21";

    ctx.fillRect(
        x + 8,
        y,
        enemy.w - 16,
        24
    );

    ctx.fillStyle =
        enemy.boss
            ? "#b62532"
            : "#a65f61";

    ctx.fillRect(
        x + enemy.w - 13,
        y + 9,
        4,
        3
    );

    ctx.fillStyle = "#151318";

    ctx.fillRect(
        x,
        y + enemy.h - 12,
        enemy.w,
        12
    );

    const hpW =
        enemy.w *
        Math.max(
            0,
            enemy.hp / enemy.maxHp
        );

    ctx.fillStyle = "#1a1518";

    ctx.fillRect(
        x,
        y - 11,
        enemy.w,
        4
    );

    ctx.fillStyle =
        enemy.boss
            ? "#942632"
            : "#755159";

    ctx.fillRect(
        x,
        y - 11,
        hpW,
        4
    );
}

function drawRain() {

    ctx.strokeStyle =
        "rgba(150,160,180,.25)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    rain.forEach(drop => {

        ctx.moveTo(
            drop.x,
            drop.y
        );

        ctx.lineTo(
            drop.x - 4,
            drop.y + drop.len
        );
    });

    ctx.stroke();
}

function drawHUD() {

    ctx.fillStyle =
        "rgba(5,5,8,.75)";

    ctx.fillRect(
        20,
        18,
        290,
        58
    );

    ctx.fillStyle = "#e2d7da";

    ctx.font =
        "bold 17px monospace";

    ctx.fillText(
        "THE STRAY",
        32,
        41
    );

    ctx.fillStyle = "#26141a";

    ctx.fillRect(
        32,
        53,
        250,
        10
    );

    ctx.fillStyle = "#8e2030";

    ctx.fillRect(
        32,
        53,
        250 *
            (
                player.hp /
                player.maxHp
            ),
        10
    );

    const boss =
        enemies.find(
            e => e.boss && e.alive
        );

    if (
        boss &&
        Math.abs(
            boss.x - player.x
        ) < 650
    ) {

        ctx.fillStyle =
            "rgba(5,5,8,.8)";

        ctx.fillRect(
            WIDTH / 2 - 230,
            HEIGHT - 63,
            460,
            40
        );

        ctx.fillStyle = "#d4c7c9";

        ctx.font =
            "bold 14px monospace";

        ctx.textAlign = "center";

        ctx.fillText(
            "THE BUTCHER",
            WIDTH / 2,
            HEIGHT - 45
        );

        ctx.fillStyle = "#291418";

        ctx.fillRect(
            WIDTH / 2 - 190,
            HEIGHT - 37,
            380,
            7
        );

        ctx.fillStyle = "#8e2530";

        ctx.fillRect(
            WIDTH / 2 - 190,
            HEIGHT - 37,
            380 *
                (
                    boss.hp /
                    boss.maxHp
                ),
            7
        );

        ctx.textAlign = "left";
    }

    if (player.dead) {

        ctx.fillStyle =
            "rgba(0,0,0,.73)";

        ctx.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        ctx.fillStyle = "#c3b6b9";

        ctx.textAlign = "center";

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

        ctx.textAlign = "left";
    }

    const living =
        enemies.filter(e => e.alive);

    if (
        living.length === 0 &&
        !player.dead
    ) {

        ctx.fillStyle =
            "rgba(0,0,0,.72)";

        ctx.fillRect(
            WIDTH / 2 - 240,
            170,
            480,
            120
        );

        ctx.fillStyle = "#d8ced0";

        ctx.textAlign = "center";

        ctx.font =
            "bold 30px monospace";

        ctx.fillText(
            "PROTOTYPE COMPLETE",
            WIDTH / 2,
            218
        );

        ctx.font =
            "16px monospace";

        ctx.fillText(
            "The streets remember your name.",
            WIDTH / 2,
            254
        );

        ctx.textAlign = "left";
    }
}

function update() {

    updatePlayer();
    updateEnemies();
    updateRain();
}

function draw() {

    drawBackground();

    enemies.forEach(drawEnemy);

    drawPlayer();

    drawRain();

    drawHUD();
}

function gameLoop() {

    update();
    draw();

    requestAnimationFrame(
        gameLoop
    );
}

gameLoop();
