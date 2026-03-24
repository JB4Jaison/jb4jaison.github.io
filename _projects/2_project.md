---
layout: page
title: Keystroke Dynamics
description: User authentication via typing behavior using a Keras neural network
img: https://fortml346612610.wordpress.com/wp-content/uploads/2019/05/keyboard-1s32u4e-1170x550.jpg?w=1000
importance: 2
category: work
---

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="https://fortml346612610.wordpress.com/wp-content/uploads/2019/05/keyboard-1s32u4e-1170x550.jpg?w=1000" title="Keystroke dynamics concept" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

**Keystroke dynamics** is a type of **behavioral biometric**. The more commonly known biometric features such as fingerprint and retina are all types of static biometrics — they are static in the sense that they do not change over time. Behavioral biometrics are more dynamic, capturing patterns over the long run. Some types of behavioral biometrics include gait analysis, voice ID, and signature analysis.

In keystroke dynamics we try to identify a user's typing pattern on a keyboard. This involves measuring how long a key is pressed, how long it takes to travel from one letter to another, and can even include the pressure at which each key is pressed. By using keystroke dynamics, a user can be authenticated without interruption. Users can be authenticated as they use the system without their knowledge — leading to applications like identifying users alongside passwords, or determining whether the person on the other side is a bot or human.

In keystroke dynamics we have different metrics used to identify the behavior of the user. **Dwell time** and **Flight time** are a couple of them. Dwell time refers to the duration for which a key is pressed and flight time refers to the duration between releasing a key and pressing the next key. Various other metrics have been used such as the pressure applied (the [Keystroke100 dataset](http://personal.ie.cuhk.edu.hk/~ccloy/downloads_keystroke100.html)), even videos and typing sounds (the [Typing Behaviour dataset](http://cvlab.cse.msu.edu/typing-behavior-dataset.html))!

Let's now get down to some action and write some solid code to train a neural network to identify some typing behaviour!

We shall be using Python and libraries like Keras and TensorFlow to create the neural network. First we need a dataset. You can get the dataset from the [CMU Keystroke Dataset](http://www.cs.cmu.edu/~keystroke/) page. In brief, the dataset consists of **51 users** who typed a phrase `.tie5Roanl` **400 times** (50 times over 8 sessions). Each user's hold time, keydown-keydown and keyup-keydown time is recorded.

<a href="https://fortml346612610.wordpress.com/2019/06/06/keystroke-dynamics-using-keras/">Original Blog Post</a>

---

We'll first import the necessary libraries

```python
import numpy as np
import pandas as pd
import keras
from keras.models import Sequential
from keras.layers import Dense
from sklearn.metrics import accuracy_score
from keras.utils import np_utils
from sklearn.preprocessing import LabelEncoder
from keras.utils.np_utils import to_categorical
import pandas
import pickle
np.set_printoptions(suppress=True)
```


Let's define the neural network class starting with the evaluate method.

```python
def evaluate(self):
    global encoder
    self.train_X = data.groupby("subject").head(320) \
                       .loc[:, "H.period":"H.Return"]
    self.train_Y = pd.DataFrame(
        data.groupby("subject").head(320).loc[:, "subject"])

    self.test_X = data.groupby("subject").tail(80) \
                      .loc[:, "H.period":"H.Return"]
    self.test_Y = pd.DataFrame(
        data.groupby("subject").tail(80).loc[:, "subject"])

    self.train_Y.columns = ['subject']
    self.df_train = pd.concat([self.train_X, self.train_Y], axis=1)
    self.df_train = self.df_train.sample(frac=1)
    self.df_test = pd.concat([self.test_X, self.test_Y], axis=1)
    self.df_test = self.df_test.sample(frac=1)

    self.train_X = self.df_train.loc[:, "H.period":"H.Return"]
    self.train_Y = self.df_train.loc[:, "subject"]
    self.test_X = self.df_test.loc[:, "H.period":"H.Return"]
    self.test_Y = self.df_test.loc[:, "subject"]

    self.test_Y = encoder.transform(self.test_Y)
    self.train_Y = encoder.transform(self.train_Y)
    self.test_Y = np_utils.to_categorical(self.test_Y)
    self.train_Y = np_utils.to_categorical(self.train_Y)

    self.training()
    self.testing()
    self.save_model()

    return
```

Here in the evaluate method we start by splitting the dataset into the training and testing set. We groupby the subjects (the different users that have taken the test) and split it in the standard 80:20 ratio. Since we have 400 per user, that results in **320 training samples** and **80 testing samples** per user — accumulating a total of **16,320 training** and **4,080 testing** samples. We concatenate the initially split dataset to the corresponding rows: the X values with the Y values. X consists of 31 columns of user key metrics and Y is the label (subject). We use `sample(frac=1)` to shuffle the dataset, then split again into X and Y.

Now the Y consists of string values which cannot be fed into the neural network. So we encode them into vectors using one-hot encoding, where the vector size equals the number of unique users and the value is 1 corresponding to the user number:

```python
def training(self):
    self.classifier = Sequential()

    # Input layer + first hidden layer (31 features -> 16 nodes)
    self.classifier.add(Dense(output_dim=16, init='uniform',
                              activation='relu', input_dim=31))

    # Second hidden layer
    self.classifier.add(Dense(output_dim=16, init='uniform',
                              activation='relu'))

    # Output layer (one node per subject)
    self.classifier.add(Dense(output_dim=51, init='uniform',
                              activation='softmax'))

    self.classifier.compile(optimizer='adam',
                            loss='binary_crossentropy',
                            metrics=['accuracy'])

    self.classifier.fit(self.train_X, self.train_Y,
                        batch_size=10, nb_epoch=150)
```

We use the `Sequential()` function from Keras to create the neural network. The network is a 3-layer Artificial Neural Network (ANN) with one hidden layer. The input layer and hidden layer consist of 16 nodes with ReLU activation. The output layer consists of 51 nodes — one for each user in the dataset — with softmax activation. We compile and fit the ANN to the training set with a batch size of 10 and epoch (number of times the entire dataset is used for training) of 150.

```python
def testing(self):
    scores = self.classifier.evaluate(self.test_X, self.test_Y)
    print("\n%s: %.2f%%" % (self.classifier.metrics_names[1],
                            scores[1] * 100))

def save_model(self):
    pkl_filename = "key_dynamics_live.pkl"
    with open(pkl_filename, 'wb') as file:
        pickle.dump(self.classifier, file)
```

The testing method evaluates the accuracy of the trained model. The model is then saved using Python's pickle module as a `.pkl` file. We now have the entire class defined. Below is the code to load the dataset and instantiate the Neural Network object:

```python
import numpy as np
import pandas as pd
import keras
from keras.models import Sequential
from keras.layers import Dense
from sklearn.metrics import accuracy_score
from keras.utils import np_utils
from sklearn.preprocessing import LabelEncoder
from keras.utils.np_utils import to_categorical
import pandas
import pickle
np.set_printoptions(suppress=True)
 
class NeuralNet:
 
    def __init__(self, subjects):
        self.subjects = subjects
 
    def training(self):
        # Initialising the ANN
        # No of subjects = 51 
 
        self.classifier = Sequential()
 
        # Adding the input layer and the first hidden layer
        self.classifier.add(Dense(output_dim=16, init='uniform', activation='relu', input_dim=31))
 
        # Adding the second hidden layer
        self.classifier.add(Dense(output_dim=16, init='uniform', activation='relu'))
 
        # Adding the output layer
        self.classifier.add(Dense(output_dim=51, init='uniform', activation='softmax'))
 
        # Compiling the ANN
        self.classifier.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
 
        # Fitting the ANN to the Training set
        self.classifier.fit(self.train_X , self.train_Y, batch_size=10, nb_epoch=150)
 
    def testing(self):
 
        scores = self.classifier.evaluate(self.test_X, self.test_Y)
        print("\n%s: %.2f%%" % (self.classifier.metrics_names[1], scores[1] * 100))
 
    def save_model(self):
 
        pkl_filename = "key_dynamics_live.pkl"
 
        with open(pkl_filename, 'wb') as file:
            pickle.dump(self.classifier, file)
 
    def evaluate(self):
 
        eers = []
        global encoder
        self.train_X = data.groupby("subject").head(320).loc[:, "H.period":"H.Return"]
        self.train_Y = pd.DataFrame(data.groupby("subject").head(320).loc[:, "subject"])
 
        self.test_X = data.groupby("subject").tail(80).loc[:, "H.period":"H.Return"]
        self.test_Y = pd.DataFrame(data.groupby("subject").tail(80).loc[:, "subject"])
 
        # No of train  16000
        # No of test 4000
        # Mixing the genuine and imposter rows
 
        # To get the no of rows in debugger object-> axes -> rows(0) ,cols(1) -> _ndarray_values -> size
 
        self.train_Y.columns = ['subject']
        self.df_train = pd.concat([self.train_X, self.train_Y],axis=1)
        self.df_train= self.df_train.sample(frac=1)
        self.df_test = pd.concat([self.test_X, self.test_Y],axis=1)
        self.df_test= self.df_test.sample(frac=1)
 
        self.train_X = self.df_train.loc[:, "H.period":"H.Return"]
        self.train_Y = self.df_train.loc[:, "subject"]
 
        self.test_X = self.df_test.loc[:, "H.period":"H.Return"]
        self.test_Y = self.df_test.loc[:, "subject"]
 
        self.test_Y= encoder.transform(self.test_Y)
        self.train_Y = encoder.transform(self.train_Y)
        self.test_Y = np_utils.to_categorical(self.test_Y)
        self.train_Y = np_utils.to_categorical(self.train_Y)
        #self.train_X = self.df[:450].loc[:, "H.period":"H.Return"]
        #self.train_Y = pd.DataFrame(self.df[:450].loc[:, "subject"])
         
        self.training()
        self.testing()
        self.save_model()
        return
 
path = "keystroke_live.csv"
data = pandas.read_csv(path)
subjects = data["subject"].unique()
print("average Accuracy for Neural Network:")
encoder = LabelEncoder()
encoder.fit(subjects)
pfile = "encoded_live.pkl"
 
with open(pfile, 'wb') as file:
    pickle.dump(encoder, file)
 
NeuralNet(subjects).evaluate()
```

Make sure you have the downloaded dataset in the same directory as the Python script and rename it as `keystroke_live.csv` (or change the path accordingly).

Alright! Now you have a model which can identify the typing behaviour of users! This can be extended into a model which incorporates your own data into the dataset to create your own typing biometric.


## References

- [CMU Keystroke Dataset](http://www.cs.cmu.edu/~keystroke/)
- [Keystroke100 Dataset](http://personal.ie.cuhk.edu.hk/~ccloy/downloads_keystroke100.html)
- [Typing Behavior Dataset](http://cvlab.cse.msu.edu/typing-behavior-dataset.html)
