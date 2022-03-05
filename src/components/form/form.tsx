const Form = () => {
  return (
    <>
      <div>
        <label htmlFor="email">Enter Your Email:</label>
        <br />
        <input id="email" name="email" type="email" autoComplete="off" />
      </div>
      <div className="errors">
        <p>An email address is required</p>
      </div>
      <button>Send Email</button>
    </>
  );
};

export default Form;
