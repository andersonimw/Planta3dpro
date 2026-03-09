const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const SENHA = '1234';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './imagens';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).substr(2,6) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Arquivo não permitido'));
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));
app.use('/imagens', express.static('imagens'));

app.post('/login', (req, res) => {
  if (req.body.senha === SENHA) res.json({ ok: true });
  else res.json({ ok: false });
});

app.post('/upload-multiplo', upload.array('arquivos', 20), (req, res) => {
  if (!req.files || req.files.length === 0) return res.json({ ok: false });
  const arquivos = req.files.map(f => ({
    url: '/imagens/' + f.filename,
    tipo: f.mimetype.startsWith('video') ? 'video' : 'imagem'
  }));
  res.json({ ok: true, arquivos });
});

app.post('/salvar-projetos', (req, res) => {
  fs.writeFileSync('./projetos.json', JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.get('/projetos', (req, res) => {
  if (fs.existsSync('./projetos.json')) {
    res.json(JSON.parse(fs.readFileSync('./projetos.json')));
  } else {
    res.json([]);
  }
});

app.get('/projeto/:codigo', (req, res) => {
  if (fs.existsSync('./projetos.json')) {
    const projetos = JSON.parse(fs.readFileSync('./projetos.json'));
    const projeto = projetos.find(p => p.codigo === req.params.codigo);
    if (projeto) return res.json(projeto);
  }
  res.status(404).json({ erro: 'Projeto não encontrado' });
});

app.listen(PORT, () => {
  console.log('Servidor rodando em http://localhost:' + PORT);
});
