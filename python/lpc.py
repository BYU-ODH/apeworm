from matplotlib import pyplot as plt
import numpy as np
from audiolazy import lazy_lpc as lpc
from audiolazy import dB20
from audiolazy.lazy_synth import line
from math import pi

data = eval(file("inputbufferdata.txt").read())
#plt.plot(data)

# see http://stackoverflow.com/questions/22328920/extract-numerical-values-from-zfilter-object-in-python-in-audiolazy-library

gain = 1e-2 # Gain just for alignment with DFT
samples = 1024
min_freq = 0
max_freq = pi

new_data = gain/lpc.lpc(data, order=20)
freqs = list(line(samples, min_freq, max_freq, finish=True))
data = new_data.freq_response(freqs)
print dB20(data)
plt.plot(dB20(data))
plt.show()
