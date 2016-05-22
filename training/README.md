## Instructions on training the multiple linear regression model.

1. Unzip VJCorpusF0.tar.gz in this directory (apeworm/training).

2. Download the Vowel Joystick corpus from http://melodi.ee.washington.edu/vj/corpus.html and unzip in this directory (apeworm/training)

3. Move the f0 meta data files to the corresponding directories of the .wav corpus files by executing the following command from the training directory:
rsync -a VJCorpusF0/ vj_dist/VJCorpus/vowels/

4. In MATLAB, navigate to training/Matlab.

5. Generate the training data and train the regression model by running the MATLAB script "main.m". This saves the weights in a file weights.json.
