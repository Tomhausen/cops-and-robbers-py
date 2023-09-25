//  vars
let speed = 30
let code = ""
let opened_chest = false
//  sprites
let robber = sprites.create(assets.image`robber`, SpriteKind.Player)
controller.moveSprite(robber)
scene.cameraFollowSprite(robber)
//  robber.set_flag(SpriteFlag.GHOST_THROUGH_WALLS, True)
spriteutils.setConsoleOverlay(true)
function convert_code(value: string): string {
    while (value.length < 4) {
        value = "0" + value
    }
    return value
}

function setup_level() {
    
    opened_chest = false
    scene.setTileMapLevel(assets.tilemap`level`)
    tiles.placeOnRandomTile(robber, assets.tile`open door`)
    for (let i = 0; i < randint(4, 8); i++) {
        spawn_guard()
    }
    tilesAdvanced.swapAllTiles(assets.tile`guard spawn`, assets.tile`floor`)
    let note = sprites.create(assets.image`note`, SpriteKind.Food)
    tiles.placeOnRandomTile(note, assets.tile`floor`)
    tiles.placeOnTile(note, robber.tilemapLocation())
    code = convert_code("" + randint(0, 9999))
}

setup_level()
function spawn_guard() {
    let guard = sprites.create(assets.image`guard`, SpriteKind.Enemy)
    tiles.placeOnRandomTile(guard, assets.tile`guard spawn`)
    sprites.setDataBoolean(guard, "searching", false)
    sprites.setDataString(guard, "colour", "blue")
    idle_behaviour(guard, guard.tilemapLocation())
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function find_note(robber: Sprite, note: Sprite) {
    robber.say(code, 100)
})
function create_escape() {
    tilesAdvanced.swapAllTiles(assets.tile`open door`, assets.tile`closed door`)
    let closed_doors = tiles.getTilesByType(assets.tile`closed door`)
    let exit = closed_doors[randint(0, closed_doors.length - 1)]
    tiles.setTileAt(exit, assets.tile`open door`)
}

scene.onOverlapTile(SpriteKind.Player, assets.tile`chest`, function open_chest(robber: Sprite, chest: tiles.Location) {
    let answer: string;
    info.changeScoreBy(1000)
    sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
    music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.UntilDone)
    setup_level()
    
    if (!opened_chest) {
        answer = "" + game.askForNumber("What is the code?", 4)
        if (convert_code(answer) == code) {
            opened_chest = true
            info.changeScoreBy(1000)
            music.play(music.melodyPlayable(music.siren), music.PlaybackMode.UntilDone)
            create_escape()
        } else {
            tiles.placeOnTile(robber, robber.tilemapLocation())
        }
        
    }
    
})
scene.onOverlapTile(SpriteKind.Player, assets.tile`open door`, function escape(robber: Sprite, door: tiles.Location) {
    if (opened_chest) {
        info.changeScoreBy(1000)
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.UntilDone)
        sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
        setup_level()
    }
    
})
function caught(robber: any, guard: any) {
    game.over(false)
}

//  sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, caught)
function idle_behaviour(guard: Sprite, location: tiles.Location) {
    let y_vel: number;
    let x_vel: number;
    if (guard.vx != 0) {
        y_vel = randint(0, 1) * speed * 2 - speed
        guard.setVelocity(0, y_vel)
    } else {
        x_vel = randint(0, 1) * speed * 2 - speed
        guard.setVelocity(x_vel, 0)
    }
    
}

scene.onHitWall(SpriteKind.Enemy, idle_behaviour)
scene.onPathCompletion(SpriteKind.Enemy, idle_behaviour)
function follow_using_pathfinding(sprite: Sprite, target: Sprite, speed: number) {
    let guard_pos = sprite.tilemapLocation()
    let path = scene.aStar(guard_pos, target.tilemapLocation())
    scene.followPath(sprite, path, speed)
}

function guard_behaviour(guard: Sprite) {
    let path: tiles.Location[];
    if (spriteutils.distanceBetween(guard, robber) > 100) {
        return
    }
    
    if (tilesAdvanced.checkLineOfSight(guard, robber)) {
        sprites.setDataBoolean(guard, "following", true)
        if (!scene.spriteIsFollowingPath(guard)) {
            follow_using_pathfinding(guard, robber, speed)
        }
        
    } else if (sprites.readDataBoolean(guard, "following")) {
        sprites.setDataBoolean(guard, "following", false)
        path = scene.aStar(guard.tilemapLocation(), robber.tilemapLocation())
        scene.followPath(guard, path)
    }
    
}

function alerted(guard: Sprite) {
    if (scene.spriteIsFollowingPath(guard)) {
        if (sprites.readDataString(guard, "colour") == "blue") {
            guard.image.replace(8, 2)
            sprites.setDataString(guard, "colour", "red")
        } else {
            guard.image.replace(2, 8)
            sprites.setDataString(guard, "colour", "blue")
        }
        
        guard.say("!")
    } else {
        guard.image.replace(2, 8)
        guard.say("")
    }
    
}

game.onUpdateInterval(500, function update_interval() {
    for (let guard of sprites.allOfKind(SpriteKind.Enemy)) {
        alerted(guard)
    }
})
game.onUpdate(function tick() {
    for (let guard of sprites.allOfKind(SpriteKind.Enemy)) {
        guard_behaviour(guard)
    }
})
