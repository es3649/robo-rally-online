export declare interface games_POST_req {
    game_type: string,
    player_name: string
}

export declare interface games_POST_res {
    room_code: string,
    host_code: string
}

export declare interface join_POST_req {
    player_name: string,
    room_code: string,
    host_key?: string
}

export declare interface join_POST_res {
    host: string,
    port: number,
}