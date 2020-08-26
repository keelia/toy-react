import { createElement ,render,Component} from "./toy-react";
class MyComponent extends Component{
    constructor(){
        super()
        this.state = {
            a:1,
            b:2
        }
    }
    render(){
        return <div>
            <h1>my component</h1>
            <button onclick={()=>{this.setState({a:this.state.a+1})}}>Add</button>
            <span>{this.state.a.toString()}</span>
            <span>{this.state.b && this.state.b.toString()}</span>
        </div>
    }
}
render(
    <MyComponent id="a" class="clsa">
        <div>abc</div>
        <div>def</div>
        <div>ghi</div>
    </MyComponent>
,document.body)//ReactDOM.render(<Game />, document.getElementById("root"));
