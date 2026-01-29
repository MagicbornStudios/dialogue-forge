interface WriterMenuHandlers {
    onDownloadMarkdown?: () => void;
    onDownloadPDF?: () => void;
    onToggleFullWidth?: () => void;
    isFullWidth?: boolean;
    canDownload?: boolean;
}
interface ProjectSwitcherProps {
    selectedProjectId: number | null;
    onProjectChange: (projectId: number | null) => void;
    writerMenus?: WriterMenuHandlers;
}
export declare function ProjectSwitcher({ selectedProjectId, onProjectChange, writerMenus }: ProjectSwitcherProps): import("react").JSX.Element;
export {};
