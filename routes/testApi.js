var express = require("express");
var router = express.Router();
var fs = require("fs");


var bodyParser = require("body-parser");

var Busboy = require('busboy');
var pump = require('pump');

var path = require('path');

const GUI_File = require("./gui_file");


var app = express();
app.use(bodyParser.json())


function isDir(path){
    return fs.lstatSync(path).isDirectory();
}

function getPathFiles(fullPath){
    let objects = new Array();

    let listFiles = new fs.readdirSync(fullPath);
    listFiles.forEach(element => {
        let fileFullPath = path.join(fullPath, element);
        let _isDir = isDir(fileFullPath);

        let icon = _isDir ? "https://img.icons8.com/small/128/000000/folder-invoices--v1.png" : "https://img.icons8.com/small/128/000000/file.png";

        objects.push(new GUI_File(element, fullPath, _isDir, icon));
    });

    if(fullPath != rootPath){
        objects.push(new GUI_File("..", fullPath, true, "https://img.icons8.com/small/128/000000/folder-invoices--v1.png"));
    }

    return objects;
}

const rootPath = require('os').homedir();

router.get("/files", function(req, res) {
		console.log(__dirname);
	
		let readPath = rootPath;

        let objects = new Array();

		let rr = new fs.readdirSync(readPath);
	
        rr.forEach(element => {
            let fullPath = path.join(readPath, element);
            let _isDir = isDir(fullPath);

            let icon = _isDir ? "https://img.icons8.com/small/128/000000/folder-invoices--v1.png" : "https://img.icons8.com/small/128/000000/file.png";

            objects.push(new GUI_File(element, readPath, _isDir, icon));
        });
		res.json(objects);
	
});


router.post("/files", function(req, res) {

    let dirName = req.body.fileName;
    let dirPath = req.body.filePath;



    let fullPath = path.join(dirPath, dirName);

    if( !fs.existsSync(fullPath) || !isDir(fullPath) ){
        console.log("fileNotFound: " + fullPath);
        res.status(404).send("Not Found");
        return;
    }

    let objects = new Array();

    let listFiles = new fs.readdirSync(fullPath);
    listFiles.forEach(element => {
        let fileFullPath = path.join(fullPath, element);
        let _isDir = isDir(fileFullPath);

        let icon = _isDir ? "https://img.icons8.com/small/128/000000/folder-invoices--v1.png" : "https://img.icons8.com/small/128/000000/file.png";

        objects.push(new GUI_File(element, fullPath, _isDir, icon));
    });

    if(fullPath != rootPath){
        objects.push(new GUI_File("..", fullPath, true, "https://img.icons8.com/small/128/000000/folder-invoices--v1.png"));
    }

    res.json(objects);

});


router.post("/rename", function(req, res, next) {

	var orgFile = path.join(req.body.filePath, req.body.originalValue);
	var newFile = path.join(req.body.filePath, req.body.value);

	fs.renameSync(orgFile, newFile);
    res.json(getPathFiles(req.body.filePath));
});

router.post("/delete", function(req, res, next) {

	var orgFile = path.join(req.body.filePath, req.body.originalValue);


	fs.unlinkSync(orgFile);
	res.json( getPathFiles(req.body.filePath));
});


router.post("/upload", function(req, res, next) {
    var busboy = new Busboy({ headers: req.headers });
    
    var output;
    var saveTo;

    let lastPath = rootPath;

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      saveTo = path.join(lastPath, filename);
      console.log('Uploading: ' + saveTo);

      output = fs.createWriteStream(saveTo);

      pump(file, output, (err) => {
          if(err !== undefined){
              console.log("Err");
              console.log(err);
          }
      });
      
    });


    // This must come before file, so we can know path
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        console.log('Field [' + fieldname + ']: value: ' + val);
        lastPath = val;
    });
    busboy.on('finish', function() {
        console.log('Upload complete');

        /* RETURN PART */

        let fullPath = lastPath;

    
        if( !fs.existsSync(fullPath) || !isDir(fullPath) ){
            console.log("fileNotFound: " + fullPath);
            res.status(404).send("Not Found");
            return;
        }
    
        let objects = new Array();
    
        let listFiles = new fs.readdirSync(fullPath);
        listFiles.forEach(element => {
            let fileFullPath = path.join(fullPath, element);
            let _isDir = isDir(fileFullPath);
    
            let icon = _isDir ? "https://img.icons8.com/small/128/000000/folder-invoices--v1.png" : "https://img.icons8.com/small/128/000000/file.png";
    
            objects.push(new GUI_File(element, fullPath, _isDir, icon));
        });
    
        if(fullPath != rootPath){
            objects.push(new GUI_File("..", fullPath, true, "https://img.icons8.com/small/128/000000/folder-invoices--v1.png"));
        }
    
        res.json(objects);


    });
    busboy.on('aborted', () => {
        console.log("Upload aborted");
    });

    req.connection.on('error', function (error) {
        if(output){
            output.close();
        }
        if(saveTo){
            fs.unlinkSync(saveTo);
        }

        console.log("Connection dropped");
    });
    

    return req.pipe(busboy);

});


router.post("/download", function(req, res, next) {


    var orgFile = path.join(req.body.filePath, req.body.originalValue);

    console.log("Download request: " + orgFile);

    res.download(orgFile, req.body.originalValue);
});

module.exports = router;
