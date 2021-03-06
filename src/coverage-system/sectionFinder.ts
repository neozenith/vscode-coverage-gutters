import {Section} from "lcov-parse";
import {extname} from "path";
import {TextEditor, Uri, workspace} from "vscode";
import {OutputChannel} from "vscode";
import {Reporter} from "../extension/reporter";
import {areFilesRelativeEquals, normalizeFileName} from "../helpers";

export class SectionFinder {

    private outputChannel: OutputChannel;
    private eventReporter: Reporter;

    constructor(
        outputChannel: OutputChannel,
        eventReporter: Reporter,
    ) {
        this.outputChannel = outputChannel;
        this.eventReporter = eventReporter;
    }

    /**
     * Compare the paths using relative logic or absolute
     * @param textEditor editor with current active file
     * @param sections sections to compare against open editors
     */
    public findSectionForEditor(
        textEditor: TextEditor,
        sections: Map<string, Section>,
    ): Section | undefined {
        function findSection(section): boolean {
            const editorFileUri = Uri.file(textEditor.document.fileName);
            const workspaceFolder = workspace.getWorkspaceFolder(editorFileUri);
            if (!workspaceFolder) { return false; }

            const workspaceFolderName = workspaceFolder.name;
            const sectionFile = normalizeFileName(section.file);
            const editorFile = normalizeFileName(textEditor.document.fileName);

            return areFilesRelativeEquals(sectionFile, editorFile, workspaceFolderName);
        }

        const sectionsArray = Array.from(sections.values());
        const foundSection = sectionsArray.find(findSection);

        if (!foundSection) { return ; }

        const filePath = foundSection.file;
        const template = `[${Date.now()}][renderer][section file path]: `;
        const message = template + `${filePath}`;
        this.outputChannel.appendLine(message);

        // log file type
        this.eventReporter.sendEvent("system", "renderer-fileType", extname(filePath));

        return foundSection;
    }

}
