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
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));
app.use('/imagens', express.static('imagens'));

app.post('/login', (req, res) => {
  if (req.body.senha === SENHA) {
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

app.post('/upload', upload.single('foto'), (req, res) => {
  if (!req.file) return res.json({ ok: false });
  res.json({ ok: true, arquivo: '/imagens/' + req.file.filename });
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
