module.exports = function(express , app, formidable, fs, os, gm, knoxClient, mongoose, io){

  var Socket;

  io.on('connection', function(socket){
    Socket = socket;
  });

  var singleImage = new mongoose.Schema({
    filename:String,
    votes: Number
  });

  console.log('CHECK singleImage:', singleImage);

  var singleImageModel = mongoose.model('singleImage', singleImage);

  var router = express.Router();

  router.get('/', function(req, res, next){
    res.render('index', {host:app.get('host')});
  });

router.post('/upload', function(req, res, next){
  console.log('CHECK, POST method called');
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
        console.log('CHECK newForm, files', files);
        tmpFile = files.upload.path;
        fname = generateFileName(files.upload.name);
        nfile = os.tmpDir() + '/' + fname;
        res.writeHead(200, {'Content-type' : 'text/plain'});
        res.end();

        console.log('CHECK newForm, tmpfile', tmpFile);
        console.log('CHECK newForm, nfile', nfile);
        console.log('CHECK newForm, fname', fname);
      });

      console.log('CHECK, tmpfile', tmpFile);
      console.log('CHECK, nfile', nfile);
      console.log('CHECK, fname', fname);

      newForm.on('end', function(){
        console.log('CHECK newForm.END, tmpfile', tmpFile);
        console.log('CHECK newForm.END, nfile', nfile);
        console.log('CHECK newForm.END, fname', fname);
        fs.rename(tmpFile , nfile, function (){
          gm(nfile).resize(300).write(nfile, function(){
            fs.readFile(nfile, function(err, buf){
              var req = knoxClient.put(fname, {
                'Content-length' : buf.length,
                'Content-type' : 'image/jpg'
              });

              req.on('response', function(res){
                console.log('CHECK response statusCode', res.statusCode);
                if(res.statusCode == 200) {
                  var newImage = new singleImageModel({
                    filename: fname,
                    votets: 0
                  }).save();

                  Socket.emit('status', {'msg' : 'Saved !!', 'delay':3000});
                  Socket.emit('doUpdate', {});

                  fs.Unlink(nfile, function(){
                    console.log('Local File Deleted');
                  });


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
