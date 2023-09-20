# vars
speed = 30
code = ""
opened_chest = False

# sprites
robber = sprites.create(assets.image("robber"), SpriteKind.player)
controller.move_sprite(robber)
scene.camera_follow_sprite(robber)
# robber.set_flag(SpriteFlag.GHOST_THROUGH_WALLS, True)

spriteutils.set_console_overlay(True)

def convert_code(value: str): # 
    while len(value) < 4:
        value = "0" + value
    return value

def setup_level():
    global opened_chest, code # 
    opened_chest = False
    scene.set_tile_map_level(assets.tilemap("level"))
    tiles.place_on_random_tile(robber, assets.tile("open door"))
    for i in range(randint(4, 8)):
        spawn_guard()
    tilesAdvanced.swap_all_tiles(assets.tile("guard spawn"), assets.tile("floor"))
    note = sprites.create(assets.image("note"), SpriteKind.food)
    tiles.place_on_random_tile(note, assets.tile("floor"))
    tiles.place_on_tile(note, robber.tilemap_location())
    code = convert_code(str(randint(0, 9999))) # 
setup_level()

def spawn_guard():
    guard = sprites.create(assets.image("guard"), SpriteKind.enemy)
    tiles.place_on_random_tile(guard, assets.tile("guard spawn"))
    sprites.set_data_boolean(guard, "searching", False)
    sprites.set_data_string(guard, "colour", "blue")
    idle_behaviour(guard, guard.tilemap_location())

def find_note(robber, note):
    robber.say(code, 100)
sprites.on_overlap(SpriteKind.player, SpriteKind.food, find_note)

def create_escape():
    tilesAdvanced.swap_all_tiles(assets.tile("open door"), assets.tile("closed door"))
    closed_doors = tiles.get_tiles_by_type(assets.tile("closed door"))
    exit = closed_doors[randint(0, len(closed_doors) - 1)]
    tiles.set_tile_at(exit, assets.tile("open door"))

def open_chest(robber, chest):
    # info.change_score_by(1000)
    # sprites.destroy_all_sprites_of_kind(SpriteKind.enemy)
    # music.play(music.melody_playable(music.ba_ding), music.PlaybackMode.UNTIL_DONE)
    # setup_level()
    global opened_chest
    if not opened_chest:
        answer = str(game.ask_for_number("What is the code?", 4))
        if convert_code(answer) == code:
            opened_chest = True
            info.change_score_by(1000)
            music.play(music.melody_playable(music.siren), music.PlaybackMode.UNTIL_DONE)
            create_escape()
        else:
            tiles.place_on_tile(robber, robber.tilemap_location())
scene.on_overlap_tile(SpriteKind.player, assets.tile("chest"), open_chest)

def escape(robber, door):
    if opened_chest:
        info.change_score_by(1000)
        music.play(music.melody_playable(music.ba_ding), music.PlaybackMode.UNTIL_DONE)
        sprites.destroy_all_sprites_of_kind(SpriteKind.enemy)
        setup_level()
scene.on_overlap_tile(SpriteKind.player, assets.tile("open door"), escape)

def caught(robber, guard):
    game.over(False)
# sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, caught)

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

def alerted(guard: Sprite):
    if scene.sprite_is_following_path(guard):
        if sprites.read_data_string(guard, "colour") == "blue":
            guard.image.replace(8, 2)
            sprites.set_data_string(guard, "colour", "red")
        else:
            guard.image.replace(2, 8)
            sprites.set_data_string(guard, "colour", "blue")
        guard.say("!")
    else:
        guard.image.replace(2, 8)
        guard.say("")

def update_interval():
    for guard in sprites.all_of_kind(SpriteKind.enemy):
        alerted(guard)
game.on_update_interval(500, update_interval)

def tick():
    for guard in sprites.all_of_kind(SpriteKind.enemy):
        guard_behaviour(guard)
game.on_update(tick)
