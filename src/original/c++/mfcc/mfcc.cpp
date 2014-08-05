#include <iostream>
#include <vector>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <string.h>
#include <iostream>
#include <vector>
#include <map>
#include "mfcc.h"

#define _USE_MATH_DEFINES

MFCC::MFCC(int noFilterBanks, int NFFT, double minFreq, double maxFreq, double sampleFreq)
{
	this->noFilterBanks = noFilterBanks;
	this->NFFT = NFFT;
	this->minFreq = minFreq;
	this->maxFreq = maxFreq;
	this->sampleFreq = sampleFreq;
	this->data = nullptr;
	
	for (int f = 0; f < 1+NFFT/2; f++) {
		binToFreq[f] = ( (double) f * sampleFreq) / (NFFT);
	}
	initFilterBanks();
}

MFCC::MFCC(double* data, int noFilterBanks, int NFFT, double minFreq, double maxFreq, double sampleFreq) 
{
	this->noFilterBanks = noFilterBanks;
	this->NFFT = NFFT;
	this->minFreq = minFreq;
	this->maxFreq = maxFreq;
	this->sampleFreq = sampleFreq;
	this->data = data;
	
	for (int f = 0; f < NFFT/2; f++) {
		binToFreq[f] = ( (double) f * sampleFreq) / (NFFT);
	}
	initFilterBanks();
}

void MFCC::initFilterBanks() 
{
	double maxMel = 1125 * log(1.0 + maxFreq/700.0);
	double minMel = 1125 * log(1.0 + minFreq/700.0);
	double dMel = (maxMel - minMel) / (noFilterBanks+1);
	for (int n = 0; n < noFilterBanks + 2; n++) {
		double mel = minMel + n * dMel;
		double Hz = 700  * (exp(mel / 1125) - 1);
		centreFreqs.push_back(Hz);
		int bin = (int)floor( (NFFT)*Hz / sampleFreq);	
		bins.push_back(bin);
	}

	for (vector<int>::iterator it1 = bins.begin() + 1 ; it1 != bins.end() - 1; it1++)  {
		vector<double> fBank;

		double fBelow = binToFreq[*(it1 - 1)];
		double fCentre = binToFreq[*it1];
		double fAbove = binToFreq[*(it1 + 1)];

		for (int n = 0; n < NFFT / 2; n++) {
			double freq = binToFreq[n];
			double val;

			if ((freq <= fCentre) && (freq >= fBelow)) {
				val = ((freq - fBelow) / (fCentre - fBelow));
			} else if ((freq > fCentre) && (freq <= fAbove)) {
				val = ((fAbove - freq) / (fAbove - fCentre));
			} else {
				val = 0.0;
			}
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

	vector<double> preDCT; // Initilise pre-discrete cosine transformation vetor array
	vector<double> postDCT;// Initilise post-discrete cosine transformation vetor array / MFCC Coefficents
 
	for (auto& it : filterBanks) {
		double cel = 0;
		int n = 0; 
		for (auto& it2 : it) {
			cel += it2 * data[n++];
		}
		preDCT.push_back(log(cel)); // Compute the log of the spectrum
	}

	// Perform the Discrete Cosine Transformation
	for (int i = 0; i < filterBanks.size(); i++) {
		double val = 0;
		int n = 0;
		for (auto& it : preDCT) {
			val += it * cos(i * (n++ - 0.5) *  M_PI / filterBanks.size());
		}
		val /= filterBanks.size();
		postDCT.push_back(val); 
	}
	return postDCT;
}

int main(void) 
{
	// Initilise fake Spectrum data (Frequency Domain) 
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
