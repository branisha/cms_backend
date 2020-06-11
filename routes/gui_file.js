class GUI_File{
    constructor(fileName, filePath, isDir, icon){
        this.fileName = fileName;
        this.filePath = filePath;
        this.isDir = isDir;
        this.icon = icon;
        this.isSelected = false;
    }
}

module.exports = GUI_File;