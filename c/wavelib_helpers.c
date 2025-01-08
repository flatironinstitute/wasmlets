#include <wavelib.h>
#include <string.h>

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

int wave_filtlength(wave_object wave) {
  return wave->filtlength;
}


/**
 * WARNING: Here be dragons. This does not seem to be an official part of the wavelib API,
 * but in order to run idwt without first running dwt, we need to set the output and length
 * fields of the wt_object struct. This is a hack to do that.
 */
void set_wt_output(wt_object wt, double* output, int outlength, int* lengths, int lenlength) {
  wt->output = output;
  wt->outlength = outlength;

  memcpy(wt->length, lengths, lenlength * sizeof(int));
  wt->lenlength = lenlength + 1;
  wt->length[lenlength] = wt->siglength;
}
