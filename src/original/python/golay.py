import numpy as np
def savitzky_golay(y, window_size, order, deriv=0, rate=1):
    r"""Smooth (and optionally differentiate) data with a Savitzky-Golay filter.
    The Savitzky-Golay filter removes high frequency noise from data.
    It has the advantage of preserving the original shape and
    features of the signal better than other types of filtering
    approaches, such as moving averages techniques.
    Parameters
    ----------
    y : array_like, shape (N,)
        the values of the time history of the signal.
    window_size : int
        the length of the window. Must be an odd integer number.
    order : int
        the order of the polynomial used in the filtering.
        Must be less then `window_size` - 1.
    deriv: int
        the order of the derivative to compute (default = 0 means only smoothing)
    Returns
    -------
    ys : ndarray, shape (N)
        the smoothed signal (or it's n-th derivative).
    Notes
    -----
    The Savitzky-Golay is a type of low-pass filter, particularly
    suited for smoothing noisy data. The main idea behind this
    approach is to make for each point a least-square fit with a
    polynomial of high order over a odd-sized window centered at
    the point.
    Examples
    --------
    t = np.linspace(-4, 4, 500)
    y = np.exp( -t**2 ) + np.random.normal(0, 0.05, t.shape)
    ysg = savitzky_golay(y, window_size=31, order=4)
    import matplotlib.pyplot as plt
    plt.plot(t, y, label='Noisy signal')
    plt.plot(t, np.exp(-t**2), 'k', lw=1.5, label='Original signal')
    plt.plot(t, ysg, 'r', label='Filtered signal')
    plt.legend()
    plt.show()
    References
    ----------
    .. [1] A. Savitzky, M. J. E. Golay, Smoothing and Differentiation of
       Data by Simplified Least Squares Procedures. Analytical
       Chemistry, 1964, 36 (8), pp 1627-1639.
    .. [2] Numerical Recipes 3rd Edition: The Art of Scientific Computing
       W.H. Press, S.A. Teukolsky, W.T. Vetterling, B.P. Flannery
       Cambridge University Press ISBN-13: 9780521880688
    """
    from math import factorial

    try:
        window_size = np.abs(np.int(window_size))
        order = np.abs(np.int(order))
    except ValueError, msg:
        raise ValueError("window_size and order have to be of type int")
    if window_size % 2 != 1 or window_size < 1:
        raise TypeError("window_size size must be a positive odd number")
    if window_size < order + 2:
        raise TypeError("window_size is too small for the polynomials order")
    order_range = range(order+1)
    half_window = (window_size -1) // 2
    # precompute coefficients
    b = np.mat([[k**i for i in order_range] for k in range(-half_window, half_window+1)])
    m = np.linalg.pinv(b).A[deriv] * rate**deriv * factorial(deriv)
    # pad the signal at the extremes with
    # values taken from the signal itself

    firstvals = y[0] - np.abs( y[1:half_window+1][::-1] - y[0] )
    lastvals = y[-1] + np.abs(y[-half_window-1:-1][::-1] - y[-1])
    y = np.concatenate((firstvals, y, lastvals))
    return np.convolve( m[::-1], y, mode='valid')

if __name__=='__main__':
    import matplotlib.pyplot as plt
    vowel = np.array([198,201,188,225,255,255,244,170,224,253,248,208,168,222,240,225,170,179,220,227,201,163,201,228,224,184,172,205,222,206,177,187,221,229,204,198,211,237,236,207,199,223,238,223,201,202,229,238,215,187,202,227,228,207,201,220,240,236,216,205,203,210,199,174,166,167,169,158,155,158,165,160,149,148,144,138,136,133,131,129,131,134,126,122,130,125,125,122,123,128,124,116,109,119,125,117,108,113,118,116,118,118,114,113,115,108,102,117,126,119,115,117,126,127,130,130,134,137,139,152,149,141,152,164,171,169,168,172,180,182,175,164,151,152,150,148,149,145,138,130,143,143,142,135,135,139,141,151,150,145,148,147,154,153,148,152,147,131,124,110,97,94,88,88,99,115,129,129,126,125,127,130,126,119,121,121,121,122,122,107,108,115,119,108,108,111,107,111,106,110,110,116,119,113,104,115,125,128,133,129,120,107,110,113,117,110,113,121,126,121,110,99,97,107,117,121,118,124,125,123,121,118,115,114,116,111,116,121,127,125,125,126,128,131,129,123,118,115,105,114,106,98,96,95,96,85,78,69,63,40,37,42,42,45,42,35,26,28,36,45,46,47,48,44,45,51,53,62,65,59,48,41,55,47,40,46,60,65,64,70,82,84,82,78,86,81,82,93,103,106,104,106,111,115,107,96,93,87,86,92,92,91,95,88,72,57,52,64,61,53,54,55,54,56,56,55,65,65,64,64,74,74,73,69,63,74,80,78,78,68,84,95,91,82,84,86,86,81,86,87,76,82,91,95,82,91,100,89,91,95,86,87,84,75,62,64,61,57,51,45,40,37,35,24,30,31,30,21,27,24,29,25,23,32,34,22,30,37,41,37,27,30,27,23,26,22,15,8,3,0,5,12,10,13,19,15,13,23,24,21,30,42,49,49,45,54,66,66,60,59,65,70,69,59,72,69,79,79,72,77,78,84,82,77,81,93,96,97,93,93,102,103,100,102,102,98,99,100,96,95,99,92,96,101,91,96,105,108,100,103,111,115,113,105,96,106,100,96,88,100,104,98,98,90,84,86,88,77,74,80,89,82,74,74,76,76,69,75,81,81,81,88,91,93,87,92,93,83,83,81,86,85,81,87,85,89,85,77,64,74,81,73,65,72,79,70,59,60,63,69,68,60,58,64,64,54,60,49,40,54,48,46,52,55,50,50,43,40,43,48,50,47,56,63,56,62,73,62,57,76,75,78,73,75,79,77,80,74,69,74,86,89,88,83,82,86,85,76,66,73,76,76,71,71,70,64,51,48,59,61,53,50,65,73,73,73,71,68,71,89,96,94,83,83,86,87,90,91,91,86,83,88,85,79,90,85,86,89,94,82,79,90,102,105,99,96,102,102,99,110,112,103,94,97,107,105,99,99,89,82,79,84,88,95,102,100,97,101,101,101,91,72,72,76,74,64,59,59,58,54,57,52,55,65,65,60,57,64,67,65,60,63,68,65,61,63,59,63,59,65,82,83,85,85,88,92,94,108,113,104,107,105,101,93,95,97,89,92,93,92,108,102,106,100,95,99,96,98,96,92,93,93,86,87,87,89,84,82,85,84,84,81,73,86,96,99,98,94,96,106,112,116,107,112,104,102,101,90,89,89,92,87,78,74,69,71,59,60,64,56,69,81,86,82,87,84,90,95,89,88,94,102,106,102,93,92,105,109,109,99,102,105,101,108,110,110,113,108,116,116,113,104,100,105,106,105,100,94,103,98,90,93,107,108,96,84,92,93,95,97,98,95,93,88,83,91,90,82,84,94,97,89,99,104,99,94,95,103,92,92,99,99,104,99,101,101,100,107,104,97,103,105,106,107,103,97,89,92,97,96,90,90,97,91,91,98,94,87,82,72,77,80,76,81,75,73,75,70,68,66,68,64,59,51,51,60,60,60,60,57,59,64,68,64,58,57,42,62,63,59,57,57,60,58,59,63,57,63,67,66,58,54,48,50,58,59,55,64,74,71,71,74,85,88,87,76,81,88,101,104,104,95,91,95,107,107,103,93,92,104,108,103,91,91,97,92,78,85,91,89,84,79,76,77,79,79,76,76,70,65,66,66,69,64,64,58,54,60,58,61,64,60,54,54,58,58,60,67,70,67,63,73,80,77,72,79,82,78,77,79,85,96,86,77,73,70,83,79,84,65,85,97,85,82,84,98,101,91,83,85,97,98,99,95,92,89,90,93,91,95,92,92,83,83,91,84,83,78,77,80,75,78,80,82,79,75,69,73,74,65,64,63,63,59,52,56,52,57,52,52,45,47,44,39,39,34,34,27,31,30,23,19,14,15])
    WINDOW_SIZE = 55 # a higher window size means a flatter graph
    ORDER = 1
    DERIVATIVE = 0
    np.set_printoptions(threshold=2000)
    plt.plot(vowel, color='black')

    vowel2 = savitzky_golay(vowel, WINDOW_SIZE, ORDER, DERIVATIVE)
    plt.plot(vowel2, color='blue')

    #vowel3 = sp.stats.gaussian_kde(vowel)
    vowel3 = savitzky_golay(vowel2, WINDOW_SIZE, ORDER, DERIVATIVE)
    plt.plot(vowel3, color='red')

    plt.show()
