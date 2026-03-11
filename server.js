const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const SENHA = '1234';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://andersonimwsl_db_user:3FMqcTLqpyA35h8h@cluster0.nzrrxsk.mongodb.net/planta3dpro?appName=Cluster0';

mongoose.connect(MONGODB_URI).then(() => console.log('MongoDB conectado!')).catch(err => console.log('Erro MongoDB:', err));

const ProjetoSchema = new mongoose.Schema({
  codigo: String,
  categoria: String,
  titulo: String,
  terreno: String,
  area: String,
  quartos: String,
  vagas: String,
  banheiros: String,
  preco: String,
  foto: String,
  midia: Array
}, { timestamps: true });

const Projeto = mongoose.model('Projeto', ProjetoSchema);

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

app.post('/salvar-projetos', async (req, res) => {
  try {
    const projetos = req.body;
    await Projeto.deleteMany({});
    await Projeto.insertMany(projetos);
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, erro: err.message });
  }
});

app.get('/projetos', async (req, res) => {
  try {
    const projetos = await Projeto.find().sort({ createdAt: -1 });
    res.json(projetos);
  } catch (err) {
    res.json([]);
  }
});

app.get('/projeto/:codigo', async (req, res) => {
  try {
    const projeto = await Projeto.findOne({ codigo: req.params.codigo });
    if (projeto) return res.json(projeto);
    res.status(404).json({ erro: 'Projeto não encontrado' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.listen(PORT, () => {
  console.log('Servidor rodando em http://localhost:' + PORT);
});
