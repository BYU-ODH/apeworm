#include <fstream>
#include <iostream>
#include <vector>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <math.h>
#include <string.h>
#include <vector>
#include <map>
#include <cmath>
#include "mfcc.h"

#define _USE_MATH_DEFINES

MFCC::MFCC(int noFilterBanks, int NFFT, double minFreq, double maxFreq, double sampleFreq)
{
	init(noFilterBanks, NFFT, minFreq, maxFreq, sampleFreq);
	this->data = nullptr;
}

MFCC::MFCC(double* data, int noFilterBanks, int NFFT, double minFreq, double maxFreq, double sampleFreq)
{
	init(noFilterBanks, NFFT, minFreq, maxFreq, sampleFreq);
	this->data = data;
}

void MFCC::init(int noFilterBanks, int NFFT, double minFreq, double maxFreq, double sampleFreq)
{
	this->noFilterBanks = noFilterBanks;
	this->NFFT = NFFT;
	this->minFreq = minFreq;
	this->maxFreq = maxFreq;
	this->sampleFreq = sampleFreq;

	for (int f = 0; f < 1+NFFT/2; f++) {
		binToFreq[f] = ( (double) f * sampleFreq) / (NFFT);
	}

	initFilterBanks();
}

void MFCC::initFilterBanks()
{
	int Nspec = NFFT / 2 + 1;
	int totalFilters = getnoFilterBanks();
	double minMel = 1127.01048 * log(1.0 + minFreq/700.0);
	double maxMel = 1127.01048 * log(1.0 + maxFreq/700.0);
	double dMel = (maxMel - minMel) / (noFilterBanks+1);
	vector<double> melSpacing;
	vector<double> fftFreqs2Mel;

	vector<double> lower;
	vector<double> center;

	// Init melSpacing
	for (int i = 0; i < noFilterBanks + 2; i++) {
		double mel = minMel + i * dMel;
		melSpacing.push_back(mel);
	}

	// Init fftFreqs2Mel
	for (int i = 0; i < Nspec; i++) {
		double fftFreq = i * getSampleFrequency()/NFFT;
		double fftFreq2Mel = log(1 + fftFreq/700) * 1127.01048;
		fftFreqs2Mel.push_back(fftFreq2Mel);
	}

	// Init lower
	for (int i = 0; i < noFilterBanks; i++) {
		lower.push_back(melSpacing[i]);
	}

	// Init center
	for (int i = 1; i < noFilterBanks + 1; i++) {
		center.push_back(melSpacing[i]);
	}

	// Prepare the mel scale filterbank
	for (int i = 0; i < totalFilters; i++) {
		vector<double> fBank;
		for (int j = 0; j < Nspec; j++) {
			double val = max(0.0, (1 - std::abs (fftFreqs2Mel[j] - center[i])/(center[i] - lower[i])));
			fBank.push_back(val);
		}
		filterBanks.push_back(fBank);
	}
}


void MFCC::setSpectrumData(double* data)         { this->data = data; }
void MFCC::setMinimumFrequency(double minFreq)   { this->minFreq = minFreq; }
void MFCC::setMaximumFrequency(double maxFreq)   { this->maxFreq = maxFreq; }
void MFCC::setSampleFrequency(double sampleFreq) { this->sampleFreq = sampleFreq; }
void MFCC::setnoFilterBanks(int noFilterBanks)   { this->noFilterBanks = noFilterBanks; }
void MFCC::setNFFT(int NFFT)                     { this->NFFT = NFFT; }

double* MFCC::getSpectrumData()     { return this->data; }
double  MFCC::getMinimumFrequency() { return this->minFreq; }
double  MFCC::getMaximumFrequency() { return this->maxFreq; }
double  MFCC::getSampleFrequency()  { return this->sampleFreq; }
int     MFCC::getnoFilterBanks()    { return this->noFilterBanks; }
int     MFCC::getNFFT()             { return this->NFFT; }

vector<double> MFCC::getLogCoefficents()
{

	if (this->data == nullptr) {
		std::cout << "No Data ! " << std::endl;
		exit(-1);
	}

	vector<double> melSpectrum;
	vector<double> preDCT; // Initilise pre-discrete cosine transformation vector array
	vector<double> postDCT;// Initilise post-discrete cosine transformation vector array / MFCC Coefficents

	// Map the spectrum to the mel scale (apply triangular filters)
 	// For each filter bank (i.e. for each mel frequency)
	for (auto& it : filterBanks) {
		double cel = 0;
		int n = 0;
		// For each frequency in the original spectrum
		for (auto& it2 : it) {
			cel += it2 * data[n++];
		}

		melSpectrum.push_back(cel);
		preDCT.push_back(log10(cel)); // Compute the log of the mel-frequency spectrum
	}

	// Perform the Discrete Cosine Transformation
	for (int i = 0; i < filterBanks.size(); i++) {
		double val = 0;
		for (int j = 0; j < preDCT.size(); j++) {
			val += preDCT[j] * cos(i * (j + 0.5) *  M_PI / filterBanks.size());
		}

		// Perform scaling used by matlab implementation of dct
		if (i == 0) {
			val /= sqrt(2.0);
		}
		val *= sqrt(2.0 / filterBanks.size());

		postDCT.push_back(val);
	}

	outputComputationSteps(&filterBanks, &melSpectrum, &preDCT, &postDCT);
	return postDCT;
}

void outputComputationSteps(vector<double>* melSpectrum, vector<double>* melLogSpectrum, vector<double>* mfccs) {

	ofstream filterBanksOut ("filter_banks.csv");
	ofstream melSpectrumOut ("mel_spectrum.csv");
	ofstream melLogPowersOut ("mel_log_powers.csv");
	ofstream mfccOut ("mfccs.csv");

	for (int i=0; i < melSpectrum.size(); i++) {

		// Output filter banks
		for (int j=0; j < filterBanks[i].size(); j++) {
			filterBanksOut << filterBanks[i][j];
			if (j < filterBanks[i].size() - 1) {
				filterBanksOut << ",";
			}
		}
		filterBanksOut << endl;

		melSpectrumOut << melSpectrum[i] <<  endl;
		melLogPowersOut << preDCT[i] <<  endl;
		mfccOut << postDCT[i] <<  endl;
	}
}

int main(void)
{
	srand(time(0));

	// Initialize fake Spectrum data (Frequency Domain)
	double data[257];
	for (int i = 0; i < 257;i++) {
		data[i] = (double) ((rand() % 100) / 100.0);
	}

	// Initilise MFCC Object
	// Number of Filters: 10
	// NFFT: 512
	// Minimum Frequency: 300 Hz
	// Maximum Frequency: 8000 Hz
	// Sampling Frequency: 16 kHz
	MFCC mfcc(10,512,300.0,8000.0,16000.0);
	mfcc.setSpectrumData(data); // Set the data pointer in the MFCC object.
	vector<double> c = mfcc.getLogCoefficents();
	for (auto& it : c) {
		std::cout << it <<  " ";
	}
	std::cout << std::endl;
	return 0;
}

void testForComparison() {
	// Load spectrum data
	ifstream file ( "spectrum_data.csv" );
	vector<double> dataVector;
	while ( file.good() ) {
		string value;
		getline ( file, value); // read a string until next line
		dataVector.push_back(atof(value.c_str()));
	}

	double* data = &dataVector[0];

	// Set parameters
	int NFFT = 1024;
	double fSample = 44100.0;
	double minF = 0.0;
	double maxF = 8000.0;
	int numFilterBanks = 40;

	MFCC mfcc(data, numFilterBanks,NFFT,minF,maxF,fSample);
	vector<double> c = mfcc.getLogCoefficents();
}
