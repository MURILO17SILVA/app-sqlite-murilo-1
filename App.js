import { useState, useEffect } from 'react';
import { 
  Alert, 
  FlatList, 
  Pressable, 
  StyleSheet, 
  Text, 
  TextInput, 
  View,
} from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { AntDesign } from '@expo/vector-icons';

// Função para inicializar o Banco de Dados
const iniciarBancoDeDados = async (db) => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS usuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT,
        telefone TEXT
      );
    `);
    console.log('Banco de Dados inicializado');
  } catch (error) {
    console.log('Erro ao iniciar o Banco de Dados.', error);
  }
};

// Componente de Contato com "foto de perfil"
const UsuarioBotao = ({ usuario, excluirUsuario, atualizarUsuario }) => {
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [estaEditando, setEstaEditando] = useState(false);
  const [usuarioEditado, setUsuarioEditado] = useState({
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
  });

  const confirmarExcluir = () => {
    Alert.alert(
      "Atenção!",
      'Deseja excluir o contato?',
      [
        { text: 'Não', onPress: () => {}, style: 'cancel' },
        { 
          text: 'Sim', 
          onPress: async () => {
            try {
              await excluirUsuario(usuario.id);
              Alert.alert('Contato excluído com sucesso!');
            } catch (error) {
              console.log('Erro ao excluir o contato:', error);
              Alert.alert('Erro ao excluir o contato!');
            }
          }
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditar = () => {
    atualizarUsuario(usuario.id, usuarioEditado.nome, usuarioEditado.email, usuarioEditado.telefone);
    setEstaEditando(false);
  };

  return (
    <View>
      <Pressable 
        style={styles.usuarioBotao}
        onPress={() => setUsuarioSelecionado(usuarioSelecionado === usuario.id ? null : usuario.id)}
      >
        <View style={styles.fotoPerfil}>
          <Text style={styles.letraPerfil}>
            {usuario.nome.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.usuarioTexto}>{usuario.nome}</Text>
        {usuarioSelecionado === usuario.id && (
          <View style={styles.actions}>
            <AntDesign 
              name='edit'
              size={18}
              color='blue'
              onPress={() => setEstaEditando(true)}
              style={styles.icon}
            />
            <AntDesign 
              name='delete'
              size={18}
              color='red'
              onPress={confirmarExcluir}
              style={styles.icon}
            />
          </View>
        )}
      </Pressable>

      {usuarioSelecionado === usuario.id && !estaEditando && (
        <View style={styles.usuarioConteudo}>
          <Text>Nome: {usuario.nome}</Text>
          <Text>Email: {usuario.email}</Text>
          <Text>Telefone: {usuario.telefone}</Text>
        </View>
      )}

      {usuarioSelecionado === usuario.id && estaEditando && (
        <UsuarioFormulario 
          usuario={usuarioEditado} 
          setUsuario={setUsuarioEditado} 
          onSave={handleEditar} 
          setMostrarFormulario={setEstaEditando} 
        />
      )}
    </View>
  );
};

const UsuarioFormulario = ({ usuario, setUsuario, onSave, setMostrarFormulario }) => {
  return (
    <View>
      <TextInput 
        style={styles.input}
        placeholder='Nome'
        value={usuario.nome}
        autoCapitalize='words'
        onChangeText={(text) => setUsuario({ ...usuario, nome: text })}
      />
      <TextInput 
        style={styles.input}
        placeholder='Email'
        value={usuario.email}
        onChangeText={(text) => setUsuario({ ...usuario, email: text })}
        autoCapitalize='none'
        keyboardType='email-address'
      />
      <TextInput 
        style={styles.input}
        placeholder='Telefone'
        value={usuario.telefone}
        onChangeText={(text) => setUsuario({ ...usuario, telefone: text })}
        keyboardType='phone-pad'
      />

      <Pressable
        onPress={onSave}
        style={styles.saveButton}
      >
        <AntDesign name="checkcircleo" size={18} color="white" />
        <Text style={styles.buttonText}>Salvar</Text>
      </Pressable>

      <Pressable
        onPress={() => setMostrarFormulario(false)}
        style={styles.cancelButton}
      >
        <AntDesign name="closecircleo" size={18} color="white" />
        <Text style={styles.buttonText}>Cancelar</Text>
      </Pressable>
    </View>
  );
};

// Função principal
const App = () => {
  return (
    <SQLiteProvider databaseName='bancoUsuario.db' onInit={iniciarBancoDeDados}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <AntDesign name="contacts" size={30} color="#25D366" />
          <Text style={styles.title}>Salva Contatos</Text>
        </View>
        <Conteudo />
      </View>
    </SQLiteProvider>
  );
};

const Conteudo = () => {
  const db = useSQLiteContext();
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuario, setUsuario] = useState({ nome: '', email: '', telefone: '' });

  const getUsuarios = async () => {
    try {
      const todosRegistros = await db.getAllAsync('SELECT * FROM usuario');
      setUsuarios(todosRegistros);
    } catch (error) {
      console.log('Erro ao ler os dados dos usuários:', error);
    }
  };

  const adicionarUsuario = async (novoUsuario) => {
    try {
      const query = await db.prepareAsync('INSERT INTO usuario (nome, email, telefone) VALUES (?, ?, ?)');
      await query.executeAsync([novoUsuario.nome, novoUsuario.email, novoUsuario.telefone]);
      await getUsuarios();
    } catch (error) {
      console.log('Erro ao adicionar o usuário:', error);
    }
  };

  const confirmarSalvar = () => {
    if (usuario.nome.length === 0 || usuario.email.length === 0 || usuario.telefone.length === 0) {
      Alert.alert('Atenção!', 'Por favor, preencha todos os dados!');
    } else {
      adicionarUsuario(usuario);
      setUsuario({ nome: '', email: '', telefone: '' });
      setMostrarFormulario(false);
    }
  };

  useEffect(() => {
    getUsuarios();
  }, []);

  const excluirUsuario = async (id) => {
    try {
      await db.execAsync('DELETE FROM usuario WHERE id = ?', [id]);
      await getUsuarios(); 
    } catch (error) {
      console.log('Erro ao excluir o usuário:', error);
    }
  };

  const excluirTodosUsuarios = async () => {
    Alert.alert(
      "Atenção!",
      'Deseja excluir todos os contatos?',
      [
        { text: 'Não', onPress: () => {}, style: 'cancel' },
        { text: 'Sim', onPress: async () => {
          try {
            await db.execAsync('DELETE FROM usuario');
            await getUsuarios();
          } catch (error) {
            console.log('Erro ao excluir todos os usuários:', error);
          }
        }},
      ],
      { cancelable: true }
    );
  };

  const atualizarUsuario = async (id, nome, email, telefone) => {
    try {
      await db.execAsync(
        'UPDATE usuario SET nome = ?, email = ?, telefone = ? WHERE id = ?',
        [nome, email, telefone, id]
      );
      await getUsuarios();
    } catch (error) {
      console.log('Erro ao atualizar o usuário:', error);
    }
  };

  return (
    <View style={styles.contentContainer}>
      {usuarios.length === 0 ? (
        <Text>Não há contatos</Text>
      ) : (
        <FlatList 
          data={usuarios}
          renderItem={({ item }) => (
            <UsuarioBotao 
              usuario={item} 
              excluirUsuario={excluirUsuario} 
              atualizarUsuario={atualizarUsuario} 
            />
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      )}

      {mostrarFormulario && (
        <UsuarioFormulario 
          usuario={usuario} 
          setUsuario={setUsuario} 
          onSave={confirmarSalvar} 
          setMostrarFormulario={setMostrarFormulario} 
        />
      )}

      <View style={styles.iconsContent}>
        <AntDesign 
          name='pluscircleo'
          size={24}
          color='green'
          onPress={() => setMostrarFormulario(true)}
        />
        <AntDesign 
          name='delete'
          size={24}
          color='red'
          onPress={excluirTodosUsuarios}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    margin: 5,
    fontSize: 33,
    fontWeight: '600',
    color: '#25D366', 
    marginLeft: 15,  
  },
  contentContainer: {
    flex: 1,
    width: '90%',
  },
  usuarioBotao: {
    backgroundColor: '#E1FFC7', 
    padding: 6,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fotoPerfil: {
    backgroundColor: '#25D366',
    width: 40,
    height: 30,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  letraPerfil: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  usuarioTexto: {
    fontSize: 20, 
    fontWeight: '700',
    color: '#075E4', 
  },
  usuarioConteudo: {
    backgroundColor: '#cdcdcd',
    padding: 10,
  },
  input: {
    borderWidth: 3,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 4,
  },
  saveButton: {
    backgroundColor: '#25D366', 
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row', 
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF6F61', 
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row', 
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8, 
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: 80,
  },
  icon: {
    marginLeft: 12,
  },
  iconsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
  },
});

export default App;
