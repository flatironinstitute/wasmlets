#include <wavelib.h>

// some helpers for things normally just done with struct access


int wt_outlength(wt_object wt) {
  return wt->outlength;
}

double* wt_output(wt_object wt) {
  return wt->output;
}

int wt_lenlength(wt_object wt) {
  return wt->lenlength;
}

int* wt_length(wt_object wt) {
  return wt->length;
}


void set_wt_output(wt_object wt, double* output, int outlength) {
  wt->output = output;
  wt->outlength = outlength;
}


int wave_filtlength(wave_object wave) {
  return wave->filtlength;
}
