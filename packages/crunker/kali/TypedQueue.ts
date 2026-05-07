// aliases
type int = number;
type double = number;
type size_t = number;
type float = number;

// interface TypedArray extends ArrayLike<number> {
//   set<T extends TypedArray>(array: T, offset?: number): void;

//   // Not quite right, but this is more for a sanity check
//   subarray<T extends TypedArray>(begin?: number, end?: number): T;
// }

interface TypedArrayConstructor<T> {
  new (size: int): T;
}

// Queue using typed arrays
class TypedQueue<T extends Float32Array> {
  private buffer: T;
  private typedArrayConstructor: TypedArrayConstructor<T>;

  private begin: int = 0; // index of first item in mem
  private end: int = 0; // 1 + index of last item in mem

  constructor(c: TypedArrayConstructor<T>) {
    this.typedArrayConstructor = c;
    this.buffer = new c(16384);
  }

  public clear() {
    this.begin = this.end = 0;
  }

  public reserve(n: int): int {
    // returns index to start writing
    if (this.begin == this.end) {
      this.clear();
    }

    while (1) {
      // If we can fit the additional data, do it
      if (this.end + n < this.buffer.length) {
        const idx = this.end;
        this.end += n;
        return idx;
      }

      // Shift to beginning of array
      if (this.begin > 16384) {
        this.buffer.set(this.buffer.subarray(this.begin, this.end));
        this.end -= this.begin;
        this.begin = 0;
        continue;
      }

      // Resize array if nothing else works
      const newbuf = new this.typedArrayConstructor(this.buffer.length + n);
      newbuf.set(this.buffer);
      this.buffer = newbuf;
    }
    throw new Error('');
  }

  public write(data: T, n: int): void {
    const offset = this.reserve(n);
    this.buffer.set(data.subarray(0, n), offset);
  }

  public write_ptr(n: int): T {
    const offset = this.reserve(n);
    return <T>this.buffer.subarray(offset, offset + n);
  }

  public read(data: T | null, n: int): void {
    if (n + this.begin > this.end) {
      console.error('Read out of bounds', n, this.end, this.begin);
    }

    if (data != null) {
      data.set(this.buffer.subarray(this.begin, this.begin + n));
    }

    this.begin += n;
  }

  public read_ptr(start: int, end: int = -1): T {
    if (end > this.occupancy()) {
      console.error('Read Pointer out of bounds', end);
    }

    if (end < 0) {
      end = this.occupancy();
    }

    return <T>this.buffer.subarray(this.begin + start, this.begin + end);
  }

  public occupancy(): size_t {
    return this.end - this.begin;
  }
}

export { TypedQueue };
