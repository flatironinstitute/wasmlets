import pywt
import numpy as np


PREAMBLE = """
import { describe, expect, test } from "vitest";

import { init, wavedec, waverec } from "wasmlets";
import { expectArrayCloseTo, expectWaveletRoundtripped } from "./util";

// prettier-ignore-start
describe("test all wavelets against pywt", () => {

""".strip()

POSTAMBLE = """
});
// prettier-ignore-end
"""


def print_test(name, data, expected, wavelet):
    print(f"""
    test("{name}", async () => {{
        await init();
        const data = new Float64Array({data});
        const expected = {expected};
        const result = wavedec(data, {wavelet!r});

        const reconstruction = waverec(result, {wavelet!r});
        expectWaveletRoundtripped(data, reconstruction);

        expect(result.length).toBe(expected.length);

        for (let i = 0; i < result.length; i++) {{
            expectArrayCloseTo(result[i], expected[i]);
        }}

    }});""")


def generate_test_signal(num_samples):
    """Generate a 2D test signal for benchmarking"""
    t = np.linspace(0, 1, num_samples)
    f1 = 10 + np.random.rand()
    f2 = 20 + np.random.rand()
    signal = np.sin(2 * np.pi * f1 * t) + 0.5 * np.sin(2 * np.pi * f2 * t)
    return signal


N = 256

if __name__ == "__main__":
    print(PREAMBLE)

    for wavelet in pywt.wavelist():
        if (
            not wavelet.startswith("db")
            and not wavelet.startswith("bior")
            and not wavelet.startswith("coif")
            and not wavelet.startswith("sym")
            and not wavelet.startswith("rbio")
        ):
            continue

        signal = generate_test_signal(N)
        coeffs = pywt.wavedec(signal, wavelet)

        data = str(signal.tolist())
        expected = str([c.tolist() for c in coeffs])

        print_test(f"test_{wavelet}", data, expected,
                   wavelet.replace("rbio", "rbior"))

        signal_odd = generate_test_signal(N - 1)
        coeffs_odd = pywt.wavedec(signal_odd, wavelet)
        data_odd = str(signal_odd.tolist())
        expected_odd = str([c.tolist() for c in coeffs_odd])

        print_test(f"test_{wavelet}_odd", data_odd, expected_odd,
                   wavelet.replace("rbio", "rbior"))

    print(POSTAMBLE)
