//  vars
let speed = 30
//  sprites
let robber = sprites.create(assets.image`robber`, SpriteKind.Player)
controller.moveSprite(robber)
scene.cameraFollowSprite(robber)
function setup_level() {
    scene.setTileMapLevel(assets.tilemap`level`)
    tiles.placeOnRandomTile(robber, assets.tile`open door`)
    for (let i = 0; i < randint(4, 8); i++) {
        spawn_guard()
    }
    tilesAdvanced.swapAllTiles(assets.tile`guard spawn`, assets.tile`floor`)
}

setup_level()
function spawn_guard() {
    let guard = sprites.create(assets.image`guard`, SpriteKind.Enemy)
    tiles.placeOnRandomTile(guard, assets.tile`guard spawn`)
    tiles.setTileAt(guard.tilemapLocation(), assets.tile`floor`)
    sprites.setDataBoolean(guard, "searching", false)
    idle_behaviour(guard, guard.tilemapLocation())
}

scene.onOverlapTile(SpriteKind.Player, assets.tile`chest`, function reach_chest(robber: Sprite, chest: tiles.Location) {
    info.changeScoreBy(1000)
    sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
    music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.UntilDone)
    setup_level()
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
