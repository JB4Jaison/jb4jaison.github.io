---
layout: page
title: Keystroke Dynamics
description: User authentication via typing behavior using a Keras neural network
img: https://fortml346612610.wordpress.com/wp-content/uploads/2019/05/keyboard-1s32u4e-1170x550.jpg?w=1000
importance: 2
category: work
---

**Keystroke Dynamics** is a behavioral biometric approach for user authentication based on typing patterns. Unlike static biometrics (fingerprints, iris scans), behavioral biometrics capture patterns over time — making it possible to continuously authenticate users without interrupting normal system usage.

<a href="https://fortml346612610.wordpress.com/2019/06/06/keystroke-dynamics-using-keras/">Blog Post</a>

---

## How It Works

Keystroke dynamics measures two primary metrics from a user's typing behavior:

- **Dwell Time** — how long a key remains pressed
- **Flight Time** — duration between releasing one key and pressing the next

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="https://fortml346612610.wordpress.com/wp-content/uploads/2019/05/keyboard-1s32u4e-1170x550.jpg?w=1000" title="Keystroke dynamics concept" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Keystroke dynamics captures unique typing patterns for biometric authentication.
</div>

---

## Dataset

The implementation uses the [CMU Keystroke Dataset](http://www.cs.cmu.edu/~keystroke/) containing **51 users** each typing the phrase `.tie5Roanl` **400 times** (50 times across 8 sessions). The dataset records hold time, keydown-keydown intervals, and keyup-keydown measurements — totaling 31 features per sample.

The data is split 80/20 for training and testing: **320 samples per user** for training (16,320 total) and **80 samples per user** for testing (4,080 total).

---

## Neural Network Architecture

A 3-layer Sequential model built with Keras:

| Layer                      | Nodes | Activation |
| -------------------------- | ----- | ---------- |
| Input + Hidden Layer 1     | 16    | ReLU       |
| Hidden Layer 2             | 16    | ReLU       |
| Output Layer (per subject) | 51    | Softmax    |

User labels are converted to categorical vectors using one-hot encoding:

<div class="row justify-content-sm-center">
    <div class="col-sm-6 mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="https://fortml346612610.wordpress.com/wp-content/uploads/2019/05/one-hot-encoding-300x129.png?w=300" title="One-hot encoding of subject labels" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    One-hot encoding converts subject identifiers into categorical vectors for the neural network.
</div>

---

## Implementation

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

    def testing(self):
        scores = self.classifier.evaluate(self.test_X, self.test_Y)
        print("\n%s: %.2f%%" % (self.classifier.metrics_names[1],
                                scores[1] * 100))

    def save_model(self):
        pkl_filename = "key_dynamics_live.pkl"
        with open(pkl_filename, 'wb') as file:
            pickle.dump(self.classifier, file)

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

path = "keystroke_live.csv"
data = pandas.read_csv(path)
subjects = data["subject"].unique()
encoder = LabelEncoder()
encoder.fit(subjects)

# Save encoder for deployment
with open("encoded_live.pkl", 'wb') as file:
    pickle.dump(encoder, file)

print("Average Accuracy for Neural Network:")
NeuralNet(subjects).evaluate()
```

---

## Training Parameters

| Parameter  | Value              |
| ---------- | ------------------ |
| Optimizer  | Adam               |
| Loss       | Binary Crossentropy|
| Batch Size | 10                 |
| Epochs     | 150                |

The trained model and label encoder are serialized as `.pkl` files using pickle for later deployment.

---

## References

- [CMU Keystroke Dataset](http://www.cs.cmu.edu/~keystroke/)
- [Keystroke100 Dataset](http://personal.ie.cuhk.edu.hk/~ccloy/downloads_keystroke100.html)
- [Typing Behavior Dataset](http://cvlab.cse.msu.edu/typing-behavior-dataset.html)
