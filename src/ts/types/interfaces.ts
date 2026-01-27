export interface MenuButtonRule {
    isActive?: boolean;
    can?: boolean;
}

export interface VideoMetadata {
    title: string;
    url: string;
    channelName: string;
    duration: string;
    lastEdit: string; // Timestamp when notes were last edited.
    uses: number; // How many times notes has been successively visited.
    size: string;
}

export enum GridSortOptions {
    MOST_RECENT = 'MOST_RECENT',
    MOST_ACTIVE = 'MOST_ACTIVE',
    A_Z = 'A_Z',
    LARGEST_SIZE = 'LARGEST_SIZE',
    OLDEST = 'OLDEST',
}
export enum GridSessionStateKeys {
    sort = 'sort',
    page = 'page',
    searchStr = 'searchStr',
}
export type GridStateType = {
    sort: GridSortOptions;
    page: number;
    pageSize: number;
    searchStr: string | null;
    totalRows: VideoMetadata[];
    filteredRows: VideoMetadata[];
    rows: VideoMetadata[];
};
export type GridSessionStateType = {
    sort: GridSortOptions;
    page: number;
    searchStr: string | null;
};

export enum ExtensionMessageType {
    DELETE_ROW = 'DELETE_ROW',
}

export interface ExtensionMessage {
    source: 'content_script' | 'popup';
    type: ExtensionMessageType;
}

export interface ExtensionMessageDeleteRow extends ExtensionMessage {
    url: string;
}
