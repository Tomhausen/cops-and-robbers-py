//  vars
let speed = 30
let code = ""
let opened_chest = false
//  sprites
let robber = sprites.create(assets.image`robber`, SpriteKind.Player)
controller.moveSprite(robber)
scene.cameraFollowSprite(robber)
function generate_code() {
    
    code = "" + randint(0, 9999)
    while (code.length < 4) {
        code = "0" + code
    }
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
    generate_code()
}

setup_level()
function spawn_guard() {
    let guard = sprites.create(assets.image`guard`, SpriteKind.Enemy)
    tiles.placeOnRandomTile(guard, assets.tile`guard spawn`)
    sprites.setDataBoolean(guard, "searching", false)
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
    let answer: number;
    //  info.change_score_by(1000)
    //  sprites.destroy_all_sprites_of_kind(SpriteKind.enemy)
    //  music.play(music.melody_playable(music.ba_ding), music.PlaybackMode.UNTIL_DONE)
    //  setup_level()
    
    if (!opened_chest) {
        answer = game.askForNumber("What is the code?", 4)
        if ("" + answer == code) {
            opened_chest = true
            info.changeScoreBy(1000)
            music.play(music.melodyPlayable(music.siren), music.PlaybackMode.UntilDone)
            create_escape()
        } else {
            tiles.placeOnTile(robber, robber.tilemapLocation())
        }
        
    }
    
})
//  def reach_chest(robber, chest):
//  info.change_score_by(1000)
//  sprites.destroy_all_sprites_of_kind(SpriteKind.enemy)
//  music.play(music.melody_playable(music.ba_ding), music.PlaybackMode.UNTIL_DONE)
//  setup_level()
//  scene.on_overlap_tile(SpriteKind.player, assets.tile("chest"), reach_chest)
scene.onOverlapTile(SpriteKind.Player, assets.tile`open door`, function escape(robber: Sprite, door: tiles.Location) {
    if (opened_chest) {
        info.changeScoreBy(1000)
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.UntilDone)
        sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
        setup_level()
    }
    
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function caught(robber: Sprite, guard: Sprite) {
    game.over(false)
})
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

game.onUpdate(function tick() {
    for (let guard of sprites.allOfKind(SpriteKind.Enemy)) {
        guard_behaviour(guard)
    }
})
