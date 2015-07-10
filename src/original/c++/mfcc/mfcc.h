/**
 * Modified from https://github.com/Maxwell79/mfccExtractor
 * See LICENSE
 */
#include <iostream>
#include <vector>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <string.h>
#include <iostream>
#include <vector>
#include <map>

using namespace std;

class MFCC {
	private: 
		double* data; // Frequency-Domain Data
		int noFilterBanks; // Number of Filter Banks
		int NFFT; // Length of the FFT
		double minFreq; // Minimun Frequency (Hz)
		double maxFreq; // Maximum Frequency (Hz)
		double sampleFreq; // Sample Frequency 

		vector<double> centreFreqs;
		vector<vector<double> >  filterBanks;  // Vector array of the filterbanks 
		vector<int> bins;  
		map<int,double> binToFreq; // Frequency Bin -> Frequency (Hz)

		void init(int noFilterBanks, int NFFT, double minFreq, double maxFreq, double sampleFreq);

	public:
		// Methods		

		// Constructors 
		MFCC(int,int,double,double,double);
		MFCC(double*, int, int, double, double, double);

		// Interaction with MFCC object
		void initFilterBanks(); // Filter banks can be reinitilised
		void setSpectrumData(double*); // MFCC pointer to data can be reinitilised 
		vector<double> getLogCoefficents(); // Main function to obtain the MFCC's 

		void setMinimumFrequency(double);
		void setMaximumFrequency(double);
		void setSampleFrequency(double);
		void setnoFilterBanks(int);
		void setNFFT(int);


		double* getSpectrumData();
		double getMinimumFrequency();
 		double getMaximumFrequency();
 		double getSampleFrequency();
		int getnoFilterBanks();
		int getNFFT();

};
