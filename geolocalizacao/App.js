import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, View, Button, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const questionsData = {
  "France": [
    { question: "Qual é a capital da França?", answer: "Paris" },
    { question: "Quantos departamentos a França tem?", answer: "101" },
    { question: "Qual é o famoso monumento em Paris?", answer: "Torre Eiffel" }
  ],
  "Japan": [
    { question: "Qual é a capital do Japão?", answer: "Tóquio" },
    { question: "Qual é a moeda do Japão?", answer: "Iene" },
    { question: "Qual é o símbolo nacional do Japão?", answer: "Crisântemo" }
  ],
  "India": [
    { question: "Qual é a capital da Índia?", answer: "Nova Délhi" },
    { question: "Quantos estados a Índia tem?", answer: "28" },
    { question: "Qual é a língua mais falada na Índia?", answer: "Hindi" }
  ],
};

function HomeScreen({ navigation }) {
  const [latitude, setLatitude] = useState(0.0);
  const [longitude, setLongitude] = useState(0.0);
  const [country, setCountry] = useState(null);

  useEffect(() => {
    const fetchLocationAndCountry = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão negada para acessar a localização.");
        return;
      }

      const location = await Location.getCurrentPositionAsync();
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      setLatitude(lat);
      setLongitude(lon);

      const country = await fetchCountry(lat, lon);
      setCountry(country);
    };

    const fetchCountry = async (lat, lon) => {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'local/1.0'
        }
      });

      const address = response.data.address;
      return address?.country || null;
    };

    fetchLocationAndCountry();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QUESTIONARIO</Text>
      

      <Text style={styles.infoText}>Longitude: {longitude === 0 ? "..." : longitude}</Text>
      <Text style={styles.infoText}>Latitude: {latitude === 0 ? "..." : latitude}</Text>
      <Text style={styles.infoText}>País: {country === null ? "..." : country}</Text>

      {country && questionsData[country] ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            navigation.navigate('Questions', { country });
          }}
        >
          <Text style={styles.buttonText}>Ver Perguntas</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noQuestionsText}>Não tem pergunta para este país.</Text>
      )}
    </View>
  );
}

function QuestionsScreen({ route, navigation }) {
  const { country } = route.params;
  const questions = questionsData[country] || [];
  const [answers, setAnswers] = useState(new Array(questions.length).fill(''));
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);

  const handleAnswerChange = (index, text) => {
    const newAnswers = [...answers];
    newAnswers[index] = text;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const incorrect = answers.reduce((acc, answer, index) => {
      if (answer.trim().toLowerCase() !== questions[index].answer.toLowerCase()) {
        acc.push(questions[index]);
      }
      return acc;
    }, []);

    navigation.navigate('Results', {
      correctAnswers: answers.length - incorrect.length,
      totalQuestions: questions.length,
      incorrectQuestions: incorrect
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Perguntas para {country}</Text>
      {questions.length > 0 ? (
        questions.map((item, index) => (
          <View key={index} style={styles.questionContainer}>
            <Text>{index + 1}. {item.question}</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua resposta"
              value={answers[index]}
              onChangeText={(text) => handleAnswerChange(index, text)}
            />
          </View>
        ))
      ) : (
        <Text>Não há perguntas disponíveis para {country}.</Text>
      )}
      {questions.length > 0 && (
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Enviar Respostas</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function ResultsScreen({ route }) {
  const { correctAnswers, totalQuestions, incorrectQuestions } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resultados</Text>
      <Text style={styles.resultText}>Você acertou {correctAnswers} de {totalQuestions} perguntas.</Text>
      <Text style={styles.resultText}>
        {correctAnswers / totalQuestions >= 0.7 ? "Parabéns! Você se saiu bem!" : "Tente novamente!"}
      </Text>

      {incorrectQuestions.length > 0 && (
        <View style={styles.incorrectQuestionsContainer}>
          <Text style={styles.title}>Perguntas Erradas:</Text>
          {incorrectQuestions.map((question, index) => (
            <View key={index} style={styles.incorrectQuestion}>
              <Text>{index + 1}. {question.question}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Questions" component={QuestionsScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  noQuestionsText: {
    fontSize: 16,
    color: '#ff0000',
    marginTop: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionContainer: {
    marginVertical: 10,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#007bff',
    padding: 10,
    width: '100%',
    marginTop: 5,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  resultText: {
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
    color: '#333',
  },
  incorrectQuestionsContainer: {
    marginTop: 20,
  },
  incorrectQuestion: {
    marginVertical: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ff0000',
    backgroundColor: '#ffe6e6',
    borderRadius: 5,
  },
});
