# vars
speed = 30

# sprites
robber = sprites.create(assets.image("robber"), SpriteKind.player)
controller.move_sprite(robber)
scene.camera_follow_sprite(robber)

def setup_level():
    scene.set_tile_map_level(assets.tilemap("level"))
    tiles.place_on_random_tile(robber, assets.tile("open door"))
    for i in range(randint(4, 8)):
        spawn_guard()
    tilesAdvanced.swap_all_tiles(assets.tile("guard spawn"), assets.tile("floor"))
setup_level()

def spawn_guard():
    guard = sprites.create(assets.image("guard"), SpriteKind.enemy)
    tiles.place_on_random_tile(guard, assets.tile("guard spawn"))
    tiles.set_tile_at(guard.tilemap_location(), assets.tile("floor"))
    sprites.set_data_boolean(guard, "searching", False)
    idle_behaviour(guard, guard.tilemap_location())

def reach_chest(robber, chest):
    info.change_score_by(1000)
    sprites.destroy_all_sprites_of_kind(SpriteKind.enemy)
    music.play(music.melody_playable(music.ba_ding), music.PlaybackMode.UNTIL_DONE)
    setup_level()
scene.on_overlap_tile(SpriteKind.player, assets.tile("chest"), reach_chest)

def caught(robber, guard):
    game.over(False)
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, caught)

def idle_behaviour(guard: Sprite, location):
    if guard.vx != 0:
        y_vel = (randint(0, 1) * speed * 2) - speed
        guard.set_velocity(0, y_vel)
    else:
        x_vel = (randint(0, 1) * speed * 2) - speed
        guard.set_velocity(x_vel, 0)
scene.on_hit_wall(SpriteKind.enemy, idle_behaviour)
scene.on_path_completion(SpriteKind.enemy, idle_behaviour)

def follow_using_pathfinding(sprite: Sprite, target: Sprite, speed):
    guard_pos = sprite.tilemap_location()
    path = scene.a_star(guard_pos, target.tilemap_location())
    scene.follow_path(sprite, path, speed)

def guard_behaviour(guard: Sprite):
    if spriteutils.distance_between(guard, robber) > 100:
        return
    if tilesAdvanced.check_line_of_sight(guard, robber):
        sprites.set_data_boolean(guard, "following", True)
        if not scene.sprite_is_following_path(guard):
            follow_using_pathfinding(guard, robber, speed)
    else:
        if sprites.read_data_boolean(guard, "following"):
            sprites.set_data_boolean(guard, "following", False)
            path = scene.a_star(guard.tilemap_location(), robber.tilemap_location())
            scene.follow_path(guard, path)

def tick():
    for guard in sprites.all_of_kind(SpriteKind.enemy):
        guard_behaviour(guard)
game.on_update(tick)
