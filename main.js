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
            <span>{this.state.a.toString()}</span>
            {this.children}
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
