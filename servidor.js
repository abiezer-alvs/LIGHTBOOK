const express = require('express');
const mysql = require('mysql');
const formidable = require('formidable');
const fs = require('fs');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer')
const bcrypt = require("bcrypt");
const saltRounds = 10;
var session = require('express-session');
const app = express();
const upload = multer({ dest: 'public/imagens/' });
const cookieParser = require('cookie-parser');
const sanitizeHtml = require('sanitize-html');

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.urlencoded({ extended: true }))
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(cookieParser());

const con = mysql.createConnection({
    host: "127.0.0.1",
    user: "user_mysql34",
    password: "M4gyHNb2w1eI",
    database: "db_mysql34"
});

app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: false,
    saveUninitialized: true
}));

con.connect(function (err) {
    if (err) throw err;
    console.log("Conectado com sucesso");
});

app.use((req, res, next) => {
    id = req.session.userId;
    var sql = "SELECT * FROM tb_usuario where id_usuario = ?";
    con.query(sql, id, function (err, result) {
        const dadosUsuario = result;
        res.locals.dadosUsuario = dadosUsuario;
        next();
    });
});

app.use((req, res, next) => {
    var sql = "SELECT * FROM tb_genero";
    con.query(sql, id, function (err, result) {
        const genero = result;
        res.locals.dadosGenero = genero;
        next();
    });
});

app.get('/', function (req, res) {
    res.render('home.ejs');
});

app.post('/cadastroUsuario', function (req, res) {
    const nome = req.body['nome'];
    const email = req.body['email'];
    const senha = req.body['senha'];

    var sql1 = "SELECT COUNT(*) AS count FROM tb_usuario WHERE email = ?";
    con.query(sql1, [email], function (err, result) {
        if (err) throw err;

        if (result[0].count > 0) {
            res.render('cadastroUsuario', { mensagem: "E-mail já cadastrado!" })
        } else {
            bcrypt.hash(senha, saltRounds, function (err, hash) {
                if (err) throw err;

                var sql = "INSERT INTO tb_usuario (nm_usuario, email, senha) VALUES (?, ?, ?)";
                con.query(sql, [nome, email, hash], function (err, result) {
                    if (err) throw err;

                    console.log("Usuário cadastrado com sucesso.");
                    res.redirect('/usuario46/loginUsuario');
                });
            });
        }
    });
});

app.get('/cadastroUsuario', function (req, res) {
    res.render('cadastroUsuario.ejs', { mensagem: null });
});

app.post('/loginUsuario', function (req, res) {
    var senha = req.body['senha'];
    var email = req.body['email']
    var sql = "SELECT * FROM tb_usuario where email = ?";
    con.query(sql, [email], function (err, result) {
        if (err) throw err;
        if (result.length) {
            bcrypt.compare(senha, result[0]['senha'], function (err, resultado) {
                if (err) throw err;
                if (resultado) {
                    req.session.logado = true;
                    req.session.username = result[0]['nm_usuario'];
                    req.session.userId = result[0]['id_usuario'];
                    res.redirect('/usuario46/autores');
                }
                else { res.render('loginUsuario', { mensagem: "Senha inválida" }) }
            });
        }
        else { res.render('loginUsuario.ejs', { mensagem: "E-mail não encontrado" }) }
    });
});
app.get('/loginUsuario', function (req, res) {
    res.render('loginUsuario.ejs', { mensagem: null });
});

app.post('/editaUsuario', upload.single('imagem'), function (req, res) {
    if (req.session.logado) {
        var id = req.session.userId;
        var nome = req.body.nome;
        var imagem = req.file;

        const hashImagem = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        const nomeimg = hashImagem + '.' + imagem.mimetype.split('/')[1];
        const newpath = path.join(__dirname, 'public/imagens/', nomeimg);


        var updateDados = "UPDATE tb_usuario SET nm_usuario = ?, img_perfil = ? WHERE id_usuario = ?";
        con.query(updateDados, [nome, nomeimg, id], function (err, result) {

            fs.rename(imagem.path, newpath, (err) => {
                if (err) {
                    console.error('Error moving file:', err);
                    throw err;
                }
            })

            const img = path.join(__dirname, 'public/imagens/', nomeimg);
            fs.unlink(img, (err) => {

            });

            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }
        });
        res.redirect('/usuario46/autores');
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});
app.get('/editaUsuario', function (req, res) {
    if (req.session.logado) {
        var id = req.session.userId;
        var sql = "SELECT * FROM tb_usuario where id_usuario = ?"

        con.query(sql, id, function (err, result, fields) {
            if (err) throw err;
            res.render('editaUsuario.ejs', { dadosUsuario: result });
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }

});

app.get('/autores', function (req, res) {
    if (req.session.logado) {
        var sql = "SELECT * FROM tb_autor"
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            res.render('autores.ejs', { dadosAutores: result, req })
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }

});

app.post('/cadastroAutor', upload.single('imagem'), (req, res) => {
    if (req.session.logado) {
        var id = req.session.userId;
        var nome = req.body.nome;  // Nome do autor
        var generos = req.body.generos;  // Array de gêneros literários selecionados
        var imagem = req.file;

        if (!Array.isArray(generos)) {
            generos = [generos];
        }

        var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        var nomeimg = hash + '.' + imagem.mimetype.split('/')[1];
        var newpath = path.join(__dirname, 'public/imagens/', nomeimg);

        fs.rename(imagem.path, newpath, function (err) {
            if (err) throw err;
        });

        var sql = "INSERT INTO tb_autor (id_usuario, nome, generos, imagem) VALUES (?, ?, ?, ?)";
        var values = [id, nome, generos.join(', '), nomeimg]; // Junte os gêneros em uma string
        con.query(sql, values, function (err, result) {
            if (err) throw err;
            console.log("Autor cadastrado!!!");
        });
        res.redirect('/usuario46/autores');
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/cadastroAutor', function (req, res) {
    if (req.session.logado) {
        res.render('cadastroAutor.ejs')

    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/obras/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var sql = "SELECT *, DATE_FORMAT(data_publicacao, '%d/%m/%Y %H:%i') AS data_formatada FROM tb_obras WHERE id_autor = ?";
        con.query(sql, id, function (err, result, fields) {
            var sql1 = "SELECT nome FROM tb_autor where id_autor= ?"

            con.query(sql1, id, function (err, result1, fields) {
                var nome = result1[0].nome;
                if (err) throw err;
                res.render('obras.ejs', { dadosObras: result, nome, id, req, mensagem: null })
            });

        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.post('/cadastroObra/:id', upload.single('imagem'), (req, res) => {
    if (req.session.logado) {
        var idUser = req.session.userId;
        var id = req.params.id;
        var nome = req.body.nome;
        var generos = req.body.generos;
        var imagem = req.file;

        if (!Array.isArray(generos)) {
            generos = [generos];
        }

        var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        var nomeimg = hash + '.' + imagem.mimetype.split('/')[1];
        var newpath = path.join(__dirname, 'public/imagens/', nomeimg);

        fs.rename(imagem.path, newpath, function (err) {
            if (err) throw err;
        });

        var sql = "INSERT INTO tb_obras (id_autor, id_usuario, nome, generos, imagem) VALUES (?, ?, ?, ?, ?)";
        var values = [id, idUser, nome, generos.join(', '), nomeimg]; // Junte os gêneros em uma string
        con.query(sql, values, function (err, result) {
            if (err) throw err;
            console.log("Obra cadastrada!!!");
        });
        res.redirect('/usuario46/obras/' + id);
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/cadastroObra/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var sql1 = "SELECT * FROM tb_autor where id_autor= ?"

        con.query(sql1, id, function (err, result1, fields) {
            var nome = result1[0].nome;
            if (err) throw err;
            res.render('cadastroObra.ejs', { nome, id, req })

        });

    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/resenhas/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var sql1 = `SELECT A.*, B.nome AS nomeObra, C.*
        FROM tb_resenha AS A
        JOIN tb_obras AS B ON A.id_obra = B.id_obra
        JOIN tb_usuario AS C ON A.id_usuario = C.id_usuario
        WHERE A.id_obra = ?;`

        con.query(sql1, id, function (err, result1, fields) {
            res.render('resenhas.ejs', { dadosResenha: result1, id, req })

        });

    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.post('/cadastroResenha/:id', (req, res) => {
    if (req.session.logado) {
        var idUser = req.session.userId;
        var id = req.params.id;
        var resenha = req.body.resenha;


        var sql1 = "SELECT id_autor FROM tb_obras where id_obra = ?"

        con.query(sql1, id, function (err, result1, fields) {
            if (err) throw err;
            var id_autor = result1[0].id_autor;

            var sql = "INSERT INTO tb_resenha (id_autor, id_usuario, id_obra, resenha) VALUES (?, ?, ?, ?)";
            var values = [id_autor, idUser, id, resenha];

            con.query(sql, values, function (err, result) {
                if (err) throw err;
                console.log("Resenha cadastrada!!!");
                res.redirect('/usuario46/resenhas/' + id);
            });
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/cadastroResenha/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var sql1 = "SELECT * FROM tb_obras where id_obra= ?"

        con.query(sql1, id, function (err, result1, fields) {
            var nome = result1[0].nome;
            if (err) throw err;
            res.render('cadastroResenha.ejs', { dadosObras: result1, id, req })

        });

    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/excluirAutor/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;

        var sqlDeleteCurtidas = "DELETE FROM tb_curtidas WHERE id_autor = ?";
        con.query(sqlDeleteCurtidas, id, function (err, resultCurtidas) {
            if (err) {
                console.error(err);
                res.redirect('back');
            } else {
                console.log("Registros em 'tb_curtidas' apagados: " + resultCurtidas.affectedRows);

                var sqlDeleteDislikes = "DELETE FROM tb_dislikes WHERE id_autor = ?";
                con.query(sqlDeleteDislikes, id, function (err, resultDislikes) {
                    if (err) {
                        console.error(err);
                        res.redirect('back');
                    } else {
                        console.log("Registros em 'tb_dislikes' apagados: " + resultDislikes.affectedRows);

                        var sqlCheck = "SELECT COUNT(*) AS count FROM tb_obras WHERE id_autor = ? AND id_usuario != ?";
                        con.query(sqlCheck, [id, req.session.userId], function (err, result) {
                            if (err) {
                                console.error(err);
                                res.redirect('back');
                            } else if (result && result[0] && result[0].count > 0) {
                                var mensagemAutor = "Não é possível excluir o autor, pois há uma obra cadastrada por outro usuário, deste autor!";
                                res.render('erro.ejs', { mensagemAutor });
                            } else {
                                var sqlDeleteResenhas = "DELETE FROM tb_resenha WHERE id_autor = ?";
                                con.query(sqlDeleteResenhas, id, function (err, result) {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('back');
                                    } else {
                                        console.log("Registros em 'tb_resenha' apagados: " + result.affectedRows);

                                        var sqlDeleteObras = "DELETE FROM tb_obras WHERE id_autor = ?";
                                        con.query(sqlDeleteObras, id, function (err, result1) {
                                            if (err) {
                                                console.error(err);
                                                res.redirect('back');
                                            } else {
                                                console.log("Registros em 'tb_obras' apagados: " + result1.affectedRows);

                                                var sqlDeleteAutor = "DELETE FROM tb_autor WHERE id_autor = ?";
                                                con.query(sqlDeleteAutor, id, function (err, result2) {
                                                    if (err) {
                                                        console.error(err);
                                                        res.redirect('back');
                                                    } else {
                                                        console.log("Registros em 'tb_autor' apagados: " + result2.affectedRows);
                                                        res.redirect('back');
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/excluirObra/:id', function (req, res) {
    if (req.session.logado) {
        var idObra = req.params.id;

        var sqlCheck = "SELECT COUNT(*) AS count FROM tb_resenha WHERE id_obra = ? AND id_usuario != ?";
        con.query(sqlCheck, [idObra, req.session.userId], function (err, result) {
            if (err) {
                console.error(err);
                res.redirect('back');
            } else if (result && result[0] && result[0].count > 0) {
                var mensagemObra = "Não é possível excluir a obra, pois há uma resenha cadastrada por outro usuário para esta obra!";
                res.render('erro.ejs', { mensagemObra, mensagemAutor: null, idObra });
            } else {
                var sqlDeleteResenhas = "DELETE FROM tb_resenha WHERE id_obra = ?";
                con.query(sqlDeleteResenhas, idObra, function (err, result2) {
                    if (err) {
                        console.error(err);
                        res.redirect('back');
                    } else {
                        console.log("Registros em 'tb_resenha' apagados: " + result2.affectedRows);

                        var sqlDeleteObras = "DELETE FROM tb_obras WHERE id_obra = ?";
                        con.query(sqlDeleteObras, idObra, function (err, result3) {
                            if (err) {
                                console.error(err);
                                res.redirect('back');
                            } else {
                                console.log("Registros em 'tb_obras' apagados: " + result3.affectedRows);
                                res.redirect('back');
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/excluirResenha/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var sql = "DELETE FROM tb_resenha WHERE id_resenha = ?";
        con.query(sql, id, function (err, result) {
            if (err) throw err;
            console.log("Registros em 'tb_resenha' apagados: " + result.affectedRows);
            res.redirect('back');
        });

    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.post('/pesquisar/:id', (req, res) => {
    if (req.session.logado) {
        if (req.body.palavraChaveAutor) {
            const palavraChaveAutor = req.body.palavraChaveAutor;

            const sql = `
                SELECT *
                FROM tb_autor
                WHERE nome LIKE ? OR generos LIKE ? 
                `;
            let params = [`%${palavraChaveAutor}%`, `%${palavraChaveAutor}%`];
            con.query(sql, params, function (err, result) {
                if (err) throw err;
                res.render('autores.ejs', { dadosAutores: result, palavraChaveAutor: palavraChaveAutor, req });
            });

        } else if (req.body.palavraChaveObra) {
            const palavraChaveObra = req.body.palavraChaveObra;

            const sql = `
                SELECT *, 
                DATE_FORMAT(data_publicacao, '%d/%m/%Y %H:%i') AS data_formatada
                FROM tb_obras
                WHERE nome LIKE ? OR generos LIKE ? 
                `;

            let params = [`%${palavraChaveObra}%`, `%${palavraChaveObra}%`];

            con.query(sql, params, function (err, result) {
                var id = req.params.id;
                var sql1 = "SELECT nome FROM tb_autor where id_autor= ?"

                con.query(sql1, id, function (err, result1, fields) {
                    var nome = result1[0].nome;
                    if (err) throw err;
                    res.render('obras.ejs', { dadosObras: result, palavraChaveObra: palavraChaveObra, req, nome, id });
                });

            });
        }
    } else {
        res.redirect('/usuario46/loginUsuario');
    }

});

app.post('/editarAutor/:id', upload.single('imagem'), (req, res) => {
    if (req.session.logado) {
        var autorId = req.params.id; 
        var idUsuario = req.session.userId;
        var nome = req.body.nome;  
        var generos = req.body.generos; 
        var imagem = req.file;

        if (!Array.isArray(generos)) {
            generos = [generos];
        }

        var nomeimg;

        if (imagem) {
            var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
            nomeimg = hash + '.' + imagem.mimetype.split('/')[1];
            var newpath = path.join(__dirname, 'public/imagens/', nomeimg);

            fs.rename(imagem.path, newpath, function (err) {
                if (err) throw err;
            });
        }

        var sqlCheckOwnership = "SELECT id_usuario, imagem FROM tb_autor WHERE id_autor = ?";
        con.query(sqlCheckOwnership, [autorId], function (err, result) {
            if (err) {
                console.error(err);
                res.redirect('back');
            } else if (result.length === 0 || result[0].id_usuario !== idUsuario) {
                res.redirect('back');
            } else {
                var sqlUpdate = "UPDATE tb_autor SET nome = ?, generos = ?" + (imagem ? ", imagem = ?" : "") + " WHERE id_autor = ?";
                var values = [nome, generos.join(', ')].concat(imagem ? [nomeimg] : [], autorId);

                con.query(sqlUpdate, values, function (err, result) {
                    if (err) {
                        console.error(err);
                        res.redirect('back');
                    } else {
                        console.log("Autor editado!!!");
                        res.redirect('/usuario46/autores');
                    }
                });
            }
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/editarAutor/:id', function (req, res) {
    if (req.session.logado) {
        var autorId = req.params.id;
        var sql = "SELECT * FROM tb_autor where id_autor = ?"

        con.query(sql, autorId, function (err, result, fields) {
            if (err) throw err;
            res.render('editarAutor.ejs', { dadosAutor: result });
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }

});

app.post('/editarObra/:id', upload.single('imagem'), (req, res) => {
    if (req.session.logado) {
        var idUser = req.session.userId;
        var idObra = req.params.id;
        var nome = req.body.nome;
        var generos = req.body.generos;
        var imagem = req.file;

        if (!Array.isArray(generos)) {
            generos = [generos];
        }

        var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        var nomeimg = hash + '.' + imagem.mimetype.split('/')[1];
        var newpath = path.join(__dirname, 'public/imagens/', nomeimg);

        fs.rename(imagem.path, newpath, function (err) {
            if (err) throw err;
        });

        var sql = "UPDATE tb_obras SET nome = ?, generos = ?, imagem = ? WHERE id_obra = ? AND id_usuario = ?";
        var values = [nome, generos.join(', '), nomeimg, idObra, idUser];
        con.query(sql, values, function (err, result) {
            var sql2 = "SELECT id_autor FROM tb_obras WHERE id_obra = ?";
            con.query(sql2, [idObra], function (err, result2, fields) {
                if (err) {
                    console.error(err);
                } else {
                    var idAutor = result2[0].id_autor;
                    res.redirect('/usuario46/obras/' + idAutor); 
                }
            });

        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/editarObra/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var sql = "SELECT * FROM tb_obras WHERE id_obra = ?";

        con.query(sql, id, function (err, result, fields) {
            if (err) throw err;
            res.render('editarObra.ejs', { dadosObra: result, id });

        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.post('/editarResenha/:id', function (req, res) {
    if (req.session.logado) {
        var idUser = req.session.userId;
        var idResenha = req.params.id;
        var idObra = req.body.idObra;
        var resenha = req.body.resenha;

        var sql = "UPDATE tb_resenha SET resenha = ? WHERE id_resenha = ? AND id_usuario = ?";
        var values = [resenha, idResenha, idUser];

        con.query(sql, values, function (err, result) {
            if (err) {
                console.error(err);
            } else {
                console.log("Resenha atualizada!!!");
                
                res.redirect('/usuario46/resenhas/' + idObra);
            }
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/editarResenha/:id', function (req, res) {
    if (req.session.logado) {
        var idResenha = req.params.id;
        var sql = "SELECT * FROM tb_resenha WHERE id_resenha = ?";

        con.query(sql, idResenha, function (err, result, fields) {
            if (err) {
                console.error(err);
            } else {
                var resenha = result[0].resenha;
                var id = result[0].id_resenha;
                var idObra = result[0].id_obra;

                var sqlObra = "SELECT nome FROM tb_obras WHERE id_obra = ?";
                con.query(sqlObra, idObra, function (errObra, resultObra, fieldsObra) {
                    if (errObra) {
                        console.error(errObra);
                    } else {
                        var nomeObra = resultObra[0].nome;
                        res.render('editarResenha.ejs', { resenha, nomeObra, idObra, id });
                    }   
                });   
            }
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/curtir/:id', function (req, res) {
    if (req.session.logado) {
        var idAutor = req.params.id;
        var idUsuario = req.session.userId;

        var sqlCheckCurtida = "SELECT * FROM tb_curtidas WHERE id_autor = ? AND id_usuario = ?";
        con.query(sqlCheckCurtida, [idAutor, idUsuario], function (err, result) {
            if (err) {
                console.error(err);
                
            } else if (result && result.length > 0) {
                var mensagemCurtida = "Você ja curtiu este autor!";
                res.render('erro.ejs', { mensagemCurtida, mensagemObra:null, mensagemAutor: null });
            } else {
                var sqlUpdateCurtida = "INSERT INTO tb_curtidas (id_autor, id_usuario) VALUES (?, ?)";
                con.query(sqlUpdateCurtida, [idAutor, idUsuario], function (err, result) {
                    var sqlUpdateCurtidas = "UPDATE tb_autor SET curtidas = curtidas + 1 WHERE id_autor = ?";
                    con.query(sqlUpdateCurtidas, idAutor, function (err, result) {
                        if (err) {
                            console.error(err);
                            res.status(500).send('Erro ao atualizar as curtidas');
                        } else {
                            res.redirect('/usuario46/autores');
                        }
                    });
                    
                });
            }
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/dislike/:id', function (req, res) {
    if (req.session.logado) {
        var idAutor = req.params.id;
        var idUsuario = req.session.userId;

        var sqlCheckCurtida = "SELECT * FROM tb_dislikes WHERE id_autor = ? AND id_usuario = ?";
        con.query(sqlCheckCurtida, [idAutor, idUsuario], function (err, result) {
            if (err) {
                console.error(err);
                
            } else if (result && result.length > 0) {
                var mensagemDislike = "Você ja deu dislike neste autor!";
                res.render('erro.ejs', { mensagemDislike, mensagemCurtida: null, mensagemObra:null, mensagemAutor: null });
            } else {
                var sqlUpdateCurtida = "INSERT INTO tb_dislikes (id_autor, id_usuario) VALUES (?, ?)";
                con.query(sqlUpdateCurtida, [idAutor, idUsuario], function (err, result) {
                    var sqlUpdateCurtidas = "UPDATE tb_autor SET dislikes = dislikes + 1 WHERE id_autor = ?";
                    con.query(sqlUpdateCurtidas, idAutor, function (err, result) {
                        if (err) {
                            console.error(err);
                            res.status(500).send('Erro ao atualizar os dislikes');
                        } else {
                            res.redirect('/usuario46/autores');
                        }
                    });
                    
                });
            }
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    }
});

app.get('/podio', function (req, res) {
    if(req.session.logado){
        var sql = "SELECT * FROM tb_autor ORDER BY curtidas DESC LIMIT 3";
        con.query(sql, function (err, result) {
            if (err) throw err;
            res.render('podio.ejs', { autoresMaisCurtidos: result });
        });
    } else {
        res.redirect('/usuario46/loginUsuario');
    } 
});

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
    })
    res.redirect('/usuario46/');
});

app.listen(3000, function () {
    console.log("Servidor Escutando na porta 3000");
});