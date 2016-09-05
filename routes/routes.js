module.exports = function(express , app, formidable, fs, os, rm, knoxClient){
  var router = express.Router();

  router.get('/', function(req, res, next){
    res.render('index', {host:app.get('host')});
  });

router.post('/upload', function(req, res, next){
  function generateFileName(filename){
    var ext_regex = /(?:\.([^.]+))?$/;
    var ext = ext_regex.exec(filename)[1];
    var date = new Date().getTime();
    var charBank = 'abcdefghijklmnopqrstuvwxyz';
    var fstring = '';

    for (var i = 0; i < 15; i++) {
      fstring += charBank[parseInt(Math.random()*26)];
    }

    return (fstring += date + '.' + ext);
  };

  var tmpFile, nfile, fname;
  var newForm = new formidable.IncomingForm();
      newForm.keepExtensions = true;
      newForm.parse(req, function(err, fields, files){
        tmpFile = files.upload.path;
        fname = generateFileName(files.upload.name);
        nfile = os.tmpDir() + '/' + fname;
        res.writeHead(200, {'Content-type' : 'text/plain'});
        res.end();
      });

      newForm.on('end', function(){
        fs.rename(tmpFile , nfile, function (){
          gm(nfile).resize(300).write(nfile, function(){
            fs.readFile(nfile, function(err, buf){
              var req = knoxClient.put(fname, {
                'Content-length' : buf.length,
                'Content-type' : 'image/jpg'
              });

              req.on('response', function(res){
                if(res.statusCode == 200) {

                }
              })

              req.end(buf);
            })
          })
        })
      })


});

  app.use('/', router);
};
