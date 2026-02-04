"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSwitcher = ProjectSwitcher;
const lucide_react_1 = require("lucide-react");
const button_1 = require("@magicborn/shared/ui/button");
const dropdown_menu_1 = require("@magicborn/shared/ui/dropdown-menu");
const ProjectSwitcher_1 = require("@magicborn/shared/ui/ProjectSwitcher");
const queries_1 = require("../app/lib/forge/queries");
function toSummary(p) {
    return { id: p.id, name: p.name };
}
function ProjectSwitcher({ selectedProjectId, onProjectChange, writerMenus }) {
    const projectsQuery = (0, queries_1.useProjects)();
    const createProjectMutation = (0, queries_1.useCreateProject)();
    const projects = (projectsQuery.data ?? []).map(toSummary);
    const isLoading = projectsQuery.isLoading ?? false;
    const handleCreateProject = async (data) => {
        const created = await createProjectMutation.mutateAsync(data);
        return toSummary(created);
    };
    const handleProjectChange = (id) => {
        onProjectChange(id === null ? null : id);
    };
    const children = (React.createElement(React.Fragment, null,
        writerMenus && (React.createElement(React.Fragment, null,
            React.createElement(dropdown_menu_1.DropdownMenu, null,
                React.createElement(dropdown_menu_1.DropdownMenuTrigger, { asChild: true },
                    React.createElement(button_1.Button, { variant: "outline", className: "min-w-[120px] justify-between" },
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Folder, { className: "h-4 w-4" }),
                            React.createElement("span", null, "File")),
                        React.createElement(lucide_react_1.ChevronDown, { className: "ml-2 h-4 w-4 shrink-0" }))),
                React.createElement(dropdown_menu_1.DropdownMenuContent, { align: "start" },
                    React.createElement(dropdown_menu_1.DropdownMenuSub, null,
                        React.createElement(dropdown_menu_1.DropdownMenuSubTrigger, null,
                            React.createElement(lucide_react_1.Download, { className: "mr-2 h-4 w-4" }),
                            "Download"),
                        React.createElement(dropdown_menu_1.DropdownMenuSubContent, null,
                            React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: writerMenus.onDownloadMarkdown, disabled: !writerMenus.canDownload },
                                React.createElement(lucide_react_1.FileText, { className: "mr-2 h-4 w-4" }),
                                "Markdown (.md)"),
                            React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: writerMenus.onDownloadPDF, disabled: !writerMenus.canDownload },
                                React.createElement(lucide_react_1.File, { className: "mr-2 h-4 w-4" }),
                                "PDF (.pdf)"))))),
            React.createElement(dropdown_menu_1.DropdownMenu, null,
                React.createElement(dropdown_menu_1.DropdownMenuTrigger, { asChild: true },
                    React.createElement(button_1.Button, { variant: "outline", className: "min-w-[120px] justify-between" },
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Eye, { className: "h-4 w-4" }),
                            React.createElement("span", null, "View")),
                        React.createElement(lucide_react_1.ChevronDown, { className: "ml-2 h-4 w-4 shrink-0" }))),
                React.createElement(dropdown_menu_1.DropdownMenuContent, { align: "start" },
                    React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: writerMenus.onToggleFullWidth },
                        writerMenus.isFullWidth ? (React.createElement(lucide_react_1.Minimize2, { className: "mr-2 h-4 w-4" })) : (React.createElement(lucide_react_1.Maximize2, { className: "mr-2 h-4 w-4" })),
                        "Full width"))))),
        React.createElement("div", { className: "ml-auto flex items-center gap-2" },
            React.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => window.open('/admin', '_blank'), title: "Open Payload Admin" }, "Admin"),
            React.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => window.open('/api/graphql-playground', '_blank'), title: "Open GraphQL Playground (API Documentation)" }, "API"))));
    return (React.createElement(ProjectSwitcher_1.ProjectSwitcher, { projects: projects, selectedProjectId: selectedProjectId, onProjectChange: handleProjectChange, onCreateProject: handleCreateProject, isLoading: isLoading, error: projectsQuery.error ? 'Failed to load projects' : null, variant: "full", children: children }));
}
