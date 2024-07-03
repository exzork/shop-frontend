export interface ApiResult<T> {
    data: T;
    message: string;
    status: string;
}

export type ErrorResponse = ApiResult<null>
export type Response = ApiResult<any>

export interface Account {
    id?: number;
    game_id: number;
    server_name: string;
    level: number;
    banner_guarantee: boolean;
    roller: string;
    code: string;
    description: string;
    price: number;
    gender: string;
    images: string;
    login: string;
    characters: Character[];
    weapons: Weapon[];
    email: string;
    password: string;
    recovery_email: string;
}


export interface Game {
    id: number;
    name: string;
    image: string;
    servers: GameServer[];
    characters: GameCharacter[];
    weapons: GameWeapon[];

}

export interface GameServer{
    value: string;
    name: string;
}

export interface GameCharacter {
    value: string;
    name: string;
    image: string;
}

export interface GameWeapon {
    value: string;
    name: string;
    image: string;
}

export interface Character {
    id?: number;
    account_id?: number;
    character: string;
    level: number;
    copies: number;
}

export interface Weapon {
    id?: number;
    account_id?: number;
    weapon: string;
    level: number;
    copies: number;
}

export interface Transaction {
    account_id: number;
    name: string;
    email: string;
    note: string;
}

export interface Roller {
    id: number;
    name: string;
    code: string;
    token: string;
}