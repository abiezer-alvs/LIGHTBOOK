var mysql = require('mysql');
var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "user_mysql34",
    password: "M4gyHNb2w1eI",
    database: "db_mysql34"
});
con.connect(function (err) {
    if (err) throw err;
    var sql = "CREATE TABLE tb_usuario (id_usuario INT AUTO_INCREMENT PRIMARY KEY NOT NULL, nm_usuario VARCHAR(60) NOT NULL, email VARCHAR(60) UNIQUE NOT NULL, senha VARCHAR(60) NOT NULL, img_perfil VARCHAR(255) NOT NULL)";
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Tabela tb_usuario criada");
    });

    if (err) throw err;
    var sql1 = "CREATE TABLE tb_genero (genero VARCHAR(60) PRIMARY KEY)";
    con.query(sql1, function (err, result) {
        if (err) throw err;
        console.log("Tabela tb_categoria criada");
    });

    if (err) throw err;
    var sql1 = `INSERT INTO tb_genero (genero) 
    VALUES('Romance'),
    ('Ficção Científica'),
    ('Mistério'),
    ('Thriller'),
    ('Fantasia'),
    ('Literatura Clássica'),
    ('Biografia'),
    ('Autobiografia'),
    ('Ficção '),
    ('Autoajuda'),
    ('Poesia '),
    ('Aventura '),
    ('Super-Heróis'),
    ('História'),
    ('Ciência')`;
    con.query(sql1, function (err, result) {
        if (err) throw err;
        console.log("Dados inseridos em tb_genero");
    });

    if (err) throw err;
    var sql1 = "CREATE TABLE tb_autor (id_autor INT AUTO_INCREMENT , id_usuario INT, nome VARCHAR (255), generos VARCHAR(255), curtidas INT DEFAULT 0, dislikes INT DEFAULT 0, imagem VARCHAR(255), PRIMARY KEY(id_autor, id_usuario), FOREIGN KEY (id_usuario) REFERENCES tb_usuario(id_usuario))";
    con.query(sql1, function (err, result) {
        if (err) throw err;
        console.log("Tabela autor criada");
    });

    if (err) throw err;
    var sql1 = "CREATE TABLE tb_obras (id_obra INT AUTO_INCREMENT, id_autor INT, id_usuario INT, nome VARCHAR(50), imagem VARCHAR(255), generos VARCHAR(255), data_publicacao TIMESTAMP, PRIMARY KEY(id_obra, id_autor, id_usuario), FOREIGN KEY (id_autor) REFERENCES tb_autor(id_autor), FOREIGN KEY (id_usuario) REFERENCES tb_usuario(id_usuario))";
    con.query(sql1, function (err, result) {
        if (err) throw err;
        console.log("Tabela obras criada");
    });

    if (err) throw err;
    var sql1 = "CREATE TABLE tb_resenha (id_resenha INT AUTO_INCREMENT, id_obra INT, id_autor INT, id_usuario INT, resenha VARCHAR(500), data_publicacao TIMESTAMP, PRIMARY KEY(id_resenha, id_obra, id_autor, id_usuario), FOREIGN KEY (id_autor) REFERENCES tb_autor(id_autor), FOREIGN KEY (id_usuario) REFERENCES tb_usuario(id_usuario), FOREIGN KEY (id_obra) REFERENCES tb_obras(id_obra))";
    con.query(sql1, function (err, result) {
        if (err) throw err;
        console.log("Tabela resenha criada");
    });

    if (err) throw err;
    var sql2 = "CREATE TABLE tb_curtidas (id_autor INT, id_usuario INT, PRIMARY KEY(id_autor, id_usuario), FOREIGN KEY (id_autor) REFERENCES tb_autor(id_autor), FOREIGN KEY (id_usuario) REFERENCES tb_usuario(id_usuario))";
    con.query(sql2, function (err, result) {
        if (err) throw err;
        console.log("Tabela curtidas criada");
    });

    if (err) throw err;
    var sql2 = "CREATE TABLE tb_dislikes (id_autor INT, id_usuario INT, PRIMARY KEY(id_autor, id_usuario), FOREIGN KEY (id_autor) REFERENCES tb_autor(id_autor), FOREIGN KEY (id_usuario) REFERENCES tb_usuario(id_usuario))";
    con.query(sql2, function (err, result) {
        if (err) throw err;
        console.log("Tabela dislikes criada");
    });
    
    con.end();
});

