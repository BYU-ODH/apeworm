function mn = freq2midinote(f)
mn = 12*log2(f./440)+69;