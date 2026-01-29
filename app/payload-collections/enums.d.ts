/**
 * Payload Collection Name Constants
 *
 * Use these constants instead of string literals for collection names
 * to ensure type safety and prevent typos.
 */
export declare const PAYLOAD_COLLECTIONS: {
    readonly PROJECTS: "projects";
    readonly MEDIA: "media";
    readonly CHARACTERS: "characters";
    readonly DIALOGUES: "dialogues";
    readonly PAGES: "pages";
    readonly STORYLET_TEMPLATES: "storylet-templates";
    readonly STORYLET_POOLS: "storylet-pools";
    readonly FLAG_SCHEMAS: "flag-schemas";
    readonly GAME_STATES: "game-states";
    readonly USERS: "users";
    readonly FORGE_GRAPHS: "forge-graphs";
    readonly VIDEO_TEMPLATES: "video-templates";
};
export type PayloadCollectionName = typeof PAYLOAD_COLLECTIONS[keyof typeof PAYLOAD_COLLECTIONS];
