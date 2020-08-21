import { createElement ,render,Component} from "./toy-react";
class MyComponent extends Component{
    render(){
        return <div>
            <h1>my component</h1>
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
